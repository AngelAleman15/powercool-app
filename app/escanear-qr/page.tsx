"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

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
  const [state, setState] = useState<"idle" | "scanning" | "unsupported" | "error">("idle")
  const [message, setMessage] = useState("Activa la cámara para escanear un código QR generado por PowerCool.")
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>(readRecentScans)

  const stopScanner = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const handleValue = useCallback((rawValue: string) => {
    const destination = getPowerCoolEquipmentUrl(rawValue)
    if (!destination) {
      setMessage("Este código no fue generado por PowerCool o no corresponde a un equipo.")
      return
    }
    stopScanner()
    const equipmentId = decodeURIComponent(destination.split("/")[2]?.split("?")[0] || "")
    const nextScans = [{ equipmentId, scannedAt: new Date().toISOString() }, ...recentScans.filter((item) => item.equipmentId !== equipmentId)].slice(0, 3)
    window.localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(nextScans))
    setRecentScans(nextScans)
    setMessage("Código verificado. Abriendo la ficha del equipo…")
    router.push(destination)
  }, [recentScans, router, stopScanner])

  const startScanner = useCallback(async () => {
    const BarcodeDetector = getDetector()
    if (!BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported")
      setMessage("El escáner requiere un navegador compatible con cámara y detección de códigos QR. Usa Chrome o Edge actualizado.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      const detector = new BarcodeDetector({ formats: ["qr_code"] })
      setState("scanning")
      setMessage("Apunta la cámara al QR del equipo.")

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
    if (!BarcodeDetector) {
      setState("unsupported")
      setMessage("La lectura de imágenes QR requiere un navegador compatible.")
      return
    }
    try {
      const image = await createImageBitmap(file)
      const codes = await new BarcodeDetector({ formats: ["qr_code"] }).detect(image)
      image.close()
      if (!codes[0]?.rawValue) {
        setMessage("No encontramos un QR legible en esta imagen.")
        return
      }
      handleValue(codes[0].rawValue)
    } catch {
      setMessage("No pudimos leer esta imagen. Prueba con una captura más nítida.")
    }
  }, [handleValue])

  useEffect(() => stopScanner, [stopScanner])

  return (
    <div className="mx-auto max-w-[1190px] px-5 py-7 text-slate-900 sm:px-8 lg:px-9 lg:py-10">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,.10)]">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" strokeLinecap="round" strokeLinejoin="round" /></svg></span><div className="min-w-0"><h1 className="text-xl font-bold tracking-[-.035em] sm:text-2xl">Escanear código QR</h1><p className="mt-1 text-sm text-slate-500">Escanea el código QR del equipo para ver su información.</p></div></div>
          <Link href="/" aria-label="Cerrar escáner" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg></Link>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1.06fr)_minmax(330px,.94fr)]">
          <section className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r lg:p-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950 shadow-inner">
              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-[24%_22%] rounded-xl border-4 border-blue-400/95 before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-[calc(100%+18px)] before:-translate-x-1/2 before:bg-blue-400 after:absolute after:left-1/2 after:top-1/2 after:h-[calc(100%+18px)] after:w-px after:-translate-x-1/2 after:-translate-y-1/2 after:bg-blue-400/40" />
              {state === "scanning" && <span className="pointer-events-none absolute left-[22%] right-[22%] top-1/2 h-0.5 bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,.9)]" />}
              {state !== "scanning" && <div className="absolute inset-0 grid place-items-center bg-slate-950/45 px-8 text-center text-sm font-medium text-slate-200"><span>Activa la cámara y centra el QR dentro del recuadro.</span></div>}
              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-950/85 px-4 py-2 text-xs font-semibold text-white backdrop-blur"><span>{state === "scanning" ? "Cámara activa" : "Cámara lista"}</span><span className="h-4 w-px bg-white/20" /><label className="cursor-pointer text-blue-300 hover:text-blue-200">Subir imagen<input className="sr-only" type="file" accept="image/*" onChange={(event) => readFile(event.target.files?.[0])} /></label></div>
            </div>
            <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm ${state === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-800"}`}>{message}</p>
            <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={startScanner} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(37,99,235,.2)] transition hover:bg-blue-700">{state === "scanning" ? "Reiniciar cámara" : "Activar cámara"}</button>{state === "scanning" && <button type="button" onClick={() => { stopScanner(); setState("idle"); setMessage("Escáner detenido.") }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Detener</button>}</div>
          </section>

          <aside className="p-6 lg:p-7"><h2 className="text-lg font-bold tracking-[-.025em]">¿Cómo escanear?</h2><ol className="mt-6 space-y-5"><li className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 font-bold text-blue-600">1</span><div><h3 className="font-bold">Enfoca el código QR</h3><p className="mt-1 text-sm leading-6 text-slate-500">Asegúrate de que esté iluminado y centrado dentro del recuadro.</p></div></li><li className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 font-bold text-blue-600">2</span><div><h3 className="font-bold">Espera el reconocimiento</h3><p className="mt-1 text-sm leading-6 text-slate-500">La ficha del equipo se abrirá automáticamente al verificarlo.</p></div></li><li className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 font-bold text-blue-600">3</span><div><h3 className="font-bold">Consulta los detalles</h3><p className="mt-1 text-sm leading-6 text-slate-500">Revisa información, historial y próximos mantenimientos.</p></div></li></ol>
            <section className="mt-8 border-t border-slate-200 pt-6"><div className="flex items-center justify-between gap-3"><h2 className="font-bold">Escaneos recientes</h2><span className="text-sm font-semibold text-blue-600">Últimos 3</span></div><div className="mt-4 overflow-hidden rounded-xl border border-slate-200">{recentScans.length ? recentScans.map((scan) => <Link key={scan.equipmentId} href={`/equipos/${encodeURIComponent(scan.equipmentId)}`} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"><span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600"><svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 5h14v4H5zM7 9v10m10-10v10M9 13h6m-3-4v8" strokeLinecap="round" strokeLinejoin="round" /></svg></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{scan.equipmentId}</p><p className="mt-0.5 text-xs text-slate-500">{formatScanTime(scan.scannedAt)}</p></div><span className="text-slate-400">›</span></Link>) : <p className="px-4 py-6 text-center text-sm text-slate-500">Todavía no hay escaneos recientes.</p>}</div></section></aside>
        </div>
        <footer className="flex items-center gap-3 border-t border-slate-200 bg-blue-50/70 px-6 py-4 text-sm text-slate-600 sm:px-8"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">i</span>¿No encuentras el código QR? Puedes encontrarlo en el costado del equipo o en su documentación.</footer>
      </section>
    </div>
  )
}
