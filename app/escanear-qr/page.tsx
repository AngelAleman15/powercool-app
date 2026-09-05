"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { BrowserQRCodeReader } from "@zxing/browser"
import { supabase } from "@/lib/supabase"

type BarcodeDetectorInstance = { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> }
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance
type ScanHistoryItem = { equipmentId: string; scannedAt: string }

const SCAN_HISTORY_KEY = "powercool.qr.recent-scans"

function getDetector() {
  return (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
}

function getPowerCoolEquipmentUrl(rawValue: string) {
  try {
    const scanned = new URL(rawValue)
    const current = window.location.origin
    if (scanned.origin !== current || !/^\/equipos\/[^/]+$/.test(scanned.pathname)) return null
    return `${scanned.pathname}${scanned.search}`
  } catch {
    return null
  }
}

function formatScanTime(value: string) {
  return new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function readRecentScans() {
  if (typeof window === "undefined") return []
  try {
    const saved = window.localStorage.getItem(SCAN_HISTORY_KEY)
    return saved ? JSON.parse(saved).slice(0, 3) as ScanHistoryItem[] : []
  } catch {
    window.localStorage.removeItem(SCAN_HISTORY_KEY)
    return []
  }
}

export default function EscanearQrPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null)
  const verifyingRef = useRef(false)
  const [state, setState] = useState<"idle" | "scanning" | "unsupported" | "error">("idle")
  const [message, setMessage] = useState("Activa la cámara para escanear un código QR generado por PowerCool.")
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>(readRecentScans)

  const stopScanner = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    zxingControlsRef.current?.stop()
    zxingControlsRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const handleValue = useCallback(async (rawValue: string) => {
    if (verifyingRef.current) return
    const destination = getPowerCoolEquipmentUrl(rawValue)
    if (!destination) {
      setMessage("Este código no fue generado por PowerCool o no corresponde a un equipo.")
      return
    }
    const equipmentId = decodeURIComponent(destination.split("/")[2]?.split("?")[0] || "")
    if (!equipmentId) {
      setMessage("El código QR no contiene un identificador de equipo válido.")
      return
    }
    verifyingRef.current = true
    setMessage("Verificando el equipo…")
    const { data, error } = await supabase.from("equipos").select("id").eq("id", equipmentId).maybeSingle()
    verifyingRef.current = false
    if (error) {
      setMessage("No pudimos verificar el equipo. Revisa tu conexión e inténtalo nuevamente.")
      return
    }
    if (!data) {
      setMessage("Este código pertenece a un equipo que ya no está disponible.")
      return
    }
    stopScanner()
    setRecentScans((currentScans) => {
      const nextScans = [{ equipmentId, scannedAt: new Date().toISOString() }, ...currentScans.filter((item) => item.equipmentId !== equipmentId)].slice(0, 3)
      window.localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(nextScans))
      return nextScans
    })
    setMessage("Código verificado. Abriendo la ficha del equipo…")
    router.push(destination)
  }, [router, stopScanner])

  const startScanner = useCallback(async () => {
    const BarcodeDetector = getDetector()
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error")
      setMessage("No detectamos acceso a la cámara. Abre PowerCool mediante HTTPS o revisa los permisos del navegador.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      setState("scanning")
      setMessage("Apunta la cámara al QR del equipo.")

      if (!BarcodeDetector) {
        const reader = new BrowserQRCodeReader()
        zxingControlsRef.current = await reader.decodeFromStream(stream, video, (result) => {
          if (result) handleValue(result.getText())
        })
        return
      }

      const detector = new BarcodeDetector({ formats: ["qr_code"] })

      const scan = async () => {
        if (!videoRef.current || streamRef.current !== stream) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes[0]?.rawValue) {
            handleValue(codes[0].rawValue)
            return
          }
        } catch {
          // El siguiente frame reintenta; algunos navegadores fallan mientras el video inicia.
        }
        frameRef.current = requestAnimationFrame(scan)
      }
      frameRef.current = requestAnimationFrame(scan)
    } catch {
      setState("error")
      setMessage("No pudimos acceder a la cámara. Revisa los permisos del navegador e inténtalo otra vez.")
    }
  }, [handleValue])

  const readFile = useCallback(async (file?: File) => {
    if (!file) return
    const BarcodeDetector = getDetector()
    try {
      if (BarcodeDetector) {
        const image = await createImageBitmap(file)
        const codes = await new BarcodeDetector({ formats: ["qr_code"] }).detect(image)
        image.close()
        if (!codes[0]?.rawValue) {
          setMessage("No encontramos un QR legible en esta imagen.")
          return
        }
        handleValue(codes[0].rawValue)
      } else {
        const reader = new BrowserQRCodeReader()
        const imageUrl = URL.createObjectURL(file)
        try {
          handleValue((await reader.decodeFromImageUrl(imageUrl)).getText())
        } finally {
          URL.revokeObjectURL(imageUrl)
        }
      }
    } catch {
      setMessage("No pudimos leer esta imagen. Prueba con una captura más nítida.")
    }
  }, [handleValue])

  useEffect(() => stopScanner, [stopScanner])

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 text-slate-900 sm:px-6 sm:py-8 lg:py-10">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,.10)]">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex min-w-0 items-center gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" strokeLinecap="round" strokeLinejoin="round" /></svg></span><div className="min-w-0"><h1 className="text-xl font-bold tracking-[-.035em] sm:text-2xl">Escanear código QR</h1><p className="mt-1 text-sm text-slate-500">Escanea el código QR del equipo para ver su información.</p></div></div>
          <Link href="/" aria-label="Cerrar escáner" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg></Link>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1.04fr)_minmax(310px,.96fr)]">
          <section className="border-b border-slate-200 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:p-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-950 shadow-inner sm:rounded-2xl">
              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-[24%_22%] before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-[calc(100%+18px)] before:-translate-x-1/2 before:bg-blue-400 after:absolute after:left-1/2 after:top-1/2 after:h-[calc(100%+18px)] after:w-px after:-translate-x-1/2 after:-translate-y-1/2 after:bg-blue-400/40"><span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-blue-400" /><span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-blue-400" /><span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-blue-400" /><span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-blue-400" /></div>
              {state === "scanning" && <span className="pointer-events-none absolute left-[22%] right-[22%] top-1/2 h-0.5 bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,.9)]" />}
              {state !== "scanning" && <div className="absolute inset-0 grid place-items-center bg-slate-950/45 px-8 text-center text-sm font-medium text-slate-200"><span>Activa la cámara y centra el QR dentro del recuadro.</span></div>}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={state === "scanning" ? () => { stopScanner(); setState("idle"); setMessage("Escáner detenido.") } : startScanner} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${state === "scanning" ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"}`}>
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 9V5h4m8 0h4v4M4 15v4h4m8 0h4v-4M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {state === "scanning" ? "Detener cámara" : "Activar cámara"}
              </button>
              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2">
                <svg aria-hidden="true" className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 16.5 8.5 12l3 3 2-2 4.5 4.5M14 8h.01M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Leer una imagen
                <input className="sr-only" type="file" accept="image/*" onChange={(event) => readFile(event.target.files?.[0])} />
              </label>
            </div>
            <p role="status" className={state === "error" || state === "unsupported" ? "mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700" : "mt-3 text-center text-sm text-slate-500"}>{message}</p>
          </section>

          <aside className="p-6 lg:p-7"><h2 className="text-lg font-bold tracking-[-.025em]">¿Cómo escanear?</h2><ol className="mt-6 space-y-5"><li className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600"><svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" strokeLinecap="round" strokeLinejoin="round" /></svg></span><div><h3 className="font-bold">Enfoca el código QR</h3><p className="mt-1 text-sm leading-6 text-slate-500">Asegúrate de que esté iluminado y centrado dentro del recuadro.</p></div></li><li className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600"><svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="m7 12 3 3 7-7M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" strokeLinecap="round" strokeLinejoin="round" /></svg></span><div><h3 className="font-bold">Espera el reconocimiento</h3><p className="mt-1 text-sm leading-6 text-slate-500">La ficha del equipo se abrirá automáticamente al verificarlo.</p></div></li><li className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600"><svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7zM14 3v5h5M10 13h5m-5 4h5" strokeLinecap="round" strokeLinejoin="round" /></svg></span><div><h3 className="font-bold">Consulta los detalles</h3><p className="mt-1 text-sm leading-6 text-slate-500">Revisa información, historial y próximos mantenimientos.</p></div></li></ol>
            <section className="mt-8 border-t border-slate-200 pt-6"><div className="flex items-center justify-between gap-3"><h2 className="font-bold">Escaneos recientes</h2><span className="text-sm font-semibold text-blue-600">Últimos 3</span></div><div className="mt-4 overflow-hidden rounded-xl border border-slate-200">{recentScans.length ? recentScans.map((scan) => <Link key={scan.equipmentId} href={`/equipos/${encodeURIComponent(scan.equipmentId)}`} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"><span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600"><svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 5h14v4H5zM7 9v10m10-10v10M9 13h6m-3-4v8" strokeLinecap="round" strokeLinejoin="round" /></svg></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{scan.equipmentId}</p><p className="mt-0.5 text-xs text-slate-500">{formatScanTime(scan.scannedAt)}</p></div><span className="text-slate-400">›</span></Link>) : <p className="px-4 py-6 text-center text-sm text-slate-500">Todavía no hay escaneos recientes.</p>}</div></section></aside>
        </div>
        <footer className="flex items-center gap-3 border-t border-slate-200 bg-blue-50/70 px-6 py-4 text-sm text-slate-600 sm:px-8"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">i</span>¿No encuentras el código QR? Puedes encontrarlo en el costado del equipo o en su documentación.</footer>
      </section>
    </div>
  )
}
