"use client"

import { useEffect, useRef } from "react"
import type { Map as LeafletMap } from "leaflet"

type DemoPoint = {
  id: string
  label: string
  lat: number
  lng: number
  color: string
}

const demoPoints: DemoPoint[] = [
  { id: "mvd-centro", label: "Hotel Oasis (Montevideo)", lat: -34.905, lng: -56.191, color: "#1e6bc1" },
  { id: "mvd-pocitos", label: "Clinica Medica (Pocitos)", lat: -34.916, lng: -56.153, color: "#1e6bc1" },
  { id: "canelones", label: "Oficinas TechCorp (Canelones)", lat: -34.522, lng: -56.277, color: "#3ea55e" },
  { id: "maldonado", label: "Supermercado Verde (Maldonado)", lat: -34.902, lng: -54.95, color: "#1e6bc1" },
  { id: "colonia", label: "Deposito Colonia", lat: -34.469, lng: -57.844, color: "#1e6bc1" },
  { id: "salto", label: "Cliente Norte (Salto)", lat: -31.389, lng: -57.961, color: "#1e6bc1" },
]

export default function UruguayMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    let mounted = true

    const initMap = async () => {
      const L = await import("leaflet")
      if (!mounted || !mapContainerRef.current || mapRef.current) return

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([-32.85, -56.0], 7)

      mapRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      demoPoints.forEach((point) => {
        L.circleMarker([point.lat, point.lng], {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: point.color,
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup(`<strong>${point.label}</strong>`)
          .bindTooltip(point.label, { direction: "top", offset: [0, -8] })
      })

      const bounds = L.latLngBounds(demoPoints.map((p) => [p.lat, p.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.25))
    }

    initMap()

    return () => {
      mounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div ref={mapContainerRef} className="h-full w-full" aria-label="Mapa interactivo de clientes" />
}
