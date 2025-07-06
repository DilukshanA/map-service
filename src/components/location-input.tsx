"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Search } from "lucide-react"
import type { Location } from "./../types/trip"
import MapSelectionModal from "./../components/map-selection-modal"

interface LocationInputProps {
  value: Location | null
  onChange: (location: Location | null) => void
  placeholder: string
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

export default function LocationInput({ value, onChange, placeholder }: LocationInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const [showMapModal, setShowMapModal] = useState(false)

  useEffect(() => {
    if (value) {
      setInputValue(value.name)
    }
  }, [value])

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Using Nominatim (OpenStreetMap) geocoding API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      )

      if (response.ok) {
        const data: SearchResult[] = await response.json()
        setSearchResults(data)
        setShowResults(true)
      }
    } catch (error) {
      console.error("Error searching location:", error)
    }
    setIsSearching(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setInputValue(query)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query)
    }, 500)
  }

  const handleSelectLocation = (result: SearchResult) => {
    const location: Location = {
      name: result.display_name,
      lat: Number.parseFloat(result.lat),
      lng: Number.parseFloat(result.lon),
    }

    onChange(location)
    setInputValue(result.display_name)
    setShowResults(false)
    setSearchResults([])
  }

  const handleMapSelect = () => {
    setShowMapModal(true)
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <Button type="button" variant="outline" size="icon" onClick={handleMapSelect} title="Select from map">
          <MapPin className="w-4 h-4" />
        </Button>
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelectLocation(result)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
                <span className="text-sm">{result.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center">
          <span className="text-sm text-gray-500">Searching...</span>
        </div>
      )}
      {showMapModal && (
        <MapSelectionModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          onSelectLocation={(location) => {
            onChange(location)
            setInputValue(location.name)
            setShowMapModal(false)
          }}
          title={`Select ${placeholder.includes("start") ? "Start" : "End"} Location`}
        />
      )}
    </div>
  )
}
