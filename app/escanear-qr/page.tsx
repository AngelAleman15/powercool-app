"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

type BarcodeDetectorInstance = { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> }
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance

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

export default function EscanearQrPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const [state, setState] = useState<"idle" | "scanning" | "unsupported" | "error">("idle")
  const [message, setMessage] = useState("Activa la cámara para escanear un código QR generado por PowerCool.")

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
    setMessage("Código verificado. Abriendo la ficha del equipo…")
    router.push(destination)
  }, [router, stopScanner])

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
    <div className="mx-auto max-w-2xl px-5 py-8 text-slate-900 sm:px-8 lg:py-12">
      <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">← Volver al Panel</Link>
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.08)] sm:p-8">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-3xl text-blue-600">⌗</span>
        <h1 className="mt-5 text-3xl font-bold tracking-[-.045em]">Escanear QR</h1>
        <p className="mt-2 text-slate-500">Solo se aceptan códigos QR generados por PowerCool para abrir fichas de equipos.</p>
        <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl bg-slate-950">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          {state !== "scanning" && <div className="absolute inset-0 grid place-items-center text-center text-sm text-slate-300">La vista de la cámara aparecerá aquí.</div>}
        </div>
        <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm ${state === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-800"}`}>{message}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={startScanner} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">{state === "scanning" ? "Reiniciar cámara" : "Activar cámara"}</button>
          {state === "scanning" && <button type="button" onClick={() => { stopScanner(); setState("idle"); setMessage("Escáner detenido.") }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Detener</button>}
          <label className="cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Leer desde imagen<input className="sr-only" type="file" accept="image/*" onChange={(event) => readFile(event.target.files?.[0])} /></label>
        </div>
      </div>
    </div>
  )
}
