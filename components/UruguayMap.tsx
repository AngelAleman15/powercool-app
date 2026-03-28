"use client"

import { useEffect, useRef } from "react"
import type { Map as LeafletMap } from "leaflet"

type MapPoint = {
  id: string
  label: string
  lat: number
  lng: number
  color: string
}

type UruguayMapProps = {
  points?: MapPoint[]
}

export default function UruguayMap({ points = [] }: UruguayMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersLayerRef = useRef<any>(null)

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
      markersLayerRef.current = L.layerGroup().addTo(map)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
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

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return

    let mounted = true

    const refreshMarkers = async () => {
      const L = await import("leaflet")
      if (!mounted || !mapRef.current || !markersLayerRef.current) return

      markersLayerRef.current.clearLayers()

      points.forEach((point) => {
        L.circleMarker([point.lat, point.lng], {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: point.color,
          fillOpacity: 1,
        })
          .addTo(markersLayerRef.current)
          .bindPopup(`<strong>${point.label}</strong>`)
          .bindTooltip(point.label, { direction: "top", offset: [0, -8] })
      })

      if (points.length > 0) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
        mapRef.current.fitBounds(bounds.pad(0.25))
      } else {
        mapRef.current.setView([-32.85, -56.0], 7)
      }
    }

    refreshMarkers()

    return () => {
      mounted = false
    }
  }, [points])

  return <div ref={mapContainerRef} className="h-full w-full" aria-label="Mapa interactivo de clientes" />
}
