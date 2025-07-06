"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, MapPin, Search } from "lucide-react"
import type { Location } from "@/types/trip"

interface MapSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (location: Location) => void
  title: string
}

export default function MapSelectionModal({ isOpen, onClose, onSelectLocation, title }: MapSelectionModalProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

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

        // Add click event listener
        mapInstanceRef.current.on("click", async (e: any) => {
          const { lat, lng } = e.latlng
          setIsLoading(true)

          // Remove existing marker
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current)
          }

          // Add new marker
          markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current)

          try {
            // Reverse geocoding to get location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            )

            if (response.ok) {
              const data = await response.json()
              const locationName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`

              const location: Location = {
                name: locationName,
                lat,
                lng,
              }

              setSelectedLocation(location)
              markerRef.current.bindPopup(locationName).openPopup()
            }
          } catch (error) {
            console.error("Error getting location name:", error)
            const location: Location = {
              name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              lat,
              lng,
            }
            setSelectedLocation(location)
          }

          setIsLoading(false)
        })
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-b">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Click anywhere on the map to select a location
          </p>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Getting location details...</p>
              </div>
            </div>
          )}
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Selected Location:</p>
                <p className="text-sm text-gray-600 break-words">{selectedLocation.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedLocation || isLoading}>
            Confirm Location
          </Button>
        </div>
      </div>

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
