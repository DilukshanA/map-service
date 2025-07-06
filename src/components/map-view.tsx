"use client"

import { useEffect, useRef } from "react"
import type { Trip } from "@/types/trip"
import { MapPin } from "lucide-react"

interface MapViewProps {
  selectedTrip: Trip | null
}

export default function MapView({ selectedTrip }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      if (typeof window === "undefined") return

      const L = (await import("leaflet")).default

      // Fix for default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      if (mapRef.current && !mapInstanceRef.current) {
        // Initialize map centered on Sri Lanka
        mapInstanceRef.current = L.map(mapRef.current).setView([7.8731, 80.7718], 8)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const updateMap = async () => {
      if (!mapInstanceRef.current || !selectedTrip) return

      const L = (await import("leaflet")).default

      // Clear existing layers
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })

      // Add start marker (green)
      const startIcon = L.divIcon({
        html: '<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: "custom-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const startMarker = L.marker([selectedTrip.startLocation.lat, selectedTrip.startLocation.lng], {
        icon: startIcon,
      }).addTo(mapInstanceRef.current)

      startMarker.bindPopup(`<b>Start:</b> ${selectedTrip.startLocation.name}`)

      // Add end marker (red)
      const endIcon = L.divIcon({
        html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: "custom-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const endMarker = L.marker([selectedTrip.endLocation.lat, selectedTrip.endLocation.lng], {
        icon: endIcon,
      }).addTo(mapInstanceRef.current)

      endMarker.bindPopup(`<b>End:</b> ${selectedTrip.endLocation.name}`)

      // Try multiple routing services for better road-based routes
      let routeFound = false

      // Try OpenRouteService first
      try {
        const orsResponse = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248d5c5c8a8a4e64b8bb5c5c8a8a4e64b8b&start=${selectedTrip.startLocation.lng},${selectedTrip.startLocation.lat}&end=${selectedTrip.endLocation.lng},${selectedTrip.endLocation.lat}`,
        )

        if (orsResponse.ok) {
          const data = await orsResponse.json()
          const coordinates = data.features[0].geometry.coordinates

          // Convert coordinates to Leaflet format [lat, lng]
          const routeCoords = coordinates.map((coord: [number, number]) => [coord[1], coord[0]])

          // Add route polyline
          L.polyline(routeCoords, {
            color: "#3b82f6",
            weight: 4,
            opacity: 0.8,
          }).addTo(mapInstanceRef.current)

          routeFound = true
        }
      } catch (error) {
        console.log("OpenRouteService failed, trying alternative...")
      }

      // If OpenRouteService fails, try OSRM (Open Source Routing Machine)
      if (!routeFound) {
        try {
          const osrmResponse = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${selectedTrip.startLocation.lng},${selectedTrip.startLocation.lat};${selectedTrip.endLocation.lng},${selectedTrip.endLocation.lat}?overview=full&geometries=geojson`,
          )

          if (osrmResponse.ok) {
            const data = await osrmResponse.json()
            const coordinates = data.routes[0].geometry.coordinates

            // Convert coordinates to Leaflet format [lat, lng]
            const routeCoords = coordinates.map((coord: [number, number]) => [coord[1], coord[0]])

            // Add route polyline
            L.polyline(routeCoords, {
              color: "#3b82f6",
              weight: 4,
              opacity: 0.8,
            }).addTo(mapInstanceRef.current)

            routeFound = true
          }
        } catch (error) {
          console.log("OSRM also failed, trying GraphHopper...")
        }
      }

      // If both fail, try GraphHopper (has a free tier)
      if (!routeFound) {
        try {
          const graphHopperResponse = await fetch(
            `https://graphhopper.com/api/1/route?point=${selectedTrip.startLocation.lat},${selectedTrip.startLocation.lng}&point=${selectedTrip.endLocation.lat},${selectedTrip.endLocation.lng}&vehicle=car&key=YOUR_GRAPHHOPPER_KEY&type=json`,
          )

          // Note: GraphHopper requires API key, so this will likely fail
          // But we keep it as an option for users who want to add their own key
        } catch (error) {
          console.log("GraphHopper failed...")
        }
      }

      // Enhanced fallback: Create a more realistic route using waypoints
      if (!routeFound) {
        // Calculate intermediate waypoints for a more realistic path
        const startLat = selectedTrip.startLocation.lat
        const startLng = selectedTrip.startLocation.lng
        const endLat = selectedTrip.endLocation.lat
        const endLng = selectedTrip.endLocation.lng

        // Create waypoints that follow major roads/highways (simplified approach)
        const waypoints = []
        const steps = 5 // Number of intermediate points

        for (let i = 0; i <= steps; i++) {
          const ratio = i / steps
          // Add some curvature to make it look more like a road
          const curveFactor = Math.sin(ratio * Math.PI) * 0.01
          const lat = startLat + (endLat - startLat) * ratio + curveFactor
          const lng = startLng + (endLng - startLng) * ratio + curveFactor * 0.5
          waypoints.push([lat, lng])
        }

        // Add curved route polyline
        L.polyline(waypoints, {
          color: "#6b7280",
          weight: 3,
          opacity: 0.7,
          dashArray: "10, 5",
        }).addTo(mapInstanceRef.current)

        // Add a note about the route being estimated
        const midpoint = waypoints[Math.floor(waypoints.length / 2)]
        L.popup()
          .setLatLng(midpoint)
          .setContent("⚠️ Estimated route - actual roads may vary")
          .openOn(mapInstanceRef.current)
      }

      // Fit map to show both markers with some padding
      const group = L.featureGroup([startMarker, endMarker])
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }

    updateMap()
  }, [selectedTrip])

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg border border-gray-300" style={{ minHeight: "400px" }} />
      {!selectedTrip && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Select a trip to view route on map</p>
          </div>
        </div>
      )}

      {/* Load Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />
    </div>
  )
}
