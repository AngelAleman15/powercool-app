"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import QRCode from "qrcode"

export default function QRCodeComponent({ id }) {

  const [qr,setQr] = useState("")

  useEffect(()=>{

    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

    QRCode.toDataURL(
      `${origin}/equipos/${id}`,
      {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }
    ).then(setQr)

  },[id])

  return (

    <div className="flex flex-col items-center gap-3">

      {qr ? (
        <>
          <div className="bg-white p-3 rounded-lg border-2 border-white/10">
            <Image src={qr} alt="QR Code" width={200} height={200} className="w-full max-w-[200px] h-auto" unoptimized />
          </div>

          <a
            href={qr}
            download={`equipo-${id}.png`}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-200 text-black text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar QR
          </a>

          <p className="text-xs text-gray-500 text-center">
            Escanea para acceder a la ficha del equipo
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <p className="text-xs text-gray-500">Generando QR...</p>
        </div>
      )}

    </div>

  )
}