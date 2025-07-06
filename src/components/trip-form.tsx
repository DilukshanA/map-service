"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Navigation } from "lucide-react"
import type { Trip, Location } from "@/types/trip"
import LocationInput from "./location-input"

interface TripFormProps {
  onAddTrip: (trip: Trip) => void
}

export default function TripForm({ onAddTrip }: TripFormProps) {
  const [tripName, setTripName] = useState("")
  const [startLocation, setStartLocation] = useState<Location | null>(null)
  const [endLocation, setEndLocation] = useState<Location | null>(null)
  const [distance, setDistance] = useState<number>(0)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateDistance = async (start: Location, end: Location) => {
    setIsCalculating(true)
    try {
      // Try OpenRouteService first
      let response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248d5c5c8a8a4e64b8bb5c5c8a8a4e64b8b&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`,
      )

      if (response.ok) {
        const data = await response.json()
        const distanceInKm = Math.round(data.features[0].properties.segments[0].distance / 1000)
        setDistance(distanceInKm)
      } else {
        // Try OSRM as fallback
        response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`,
        )

        if (response.ok) {
          const data = await response.json()
          const distanceInKm = Math.round(data.routes[0].distance / 1000)
          setDistance(distanceInKm)
        } else {
          // Final fallback to straight-line distance with road factor
          const straightDistance = calculateStraightLineDistance(start, end)
          // Multiply by 1.3 to account for road curves and detours
          setDistance(Math.round(straightDistance * 1.3))
        }
      }
    } catch (error) {
      // Final fallback to straight-line distance with road factor
      const straightDistance = calculateStraightLineDistance(start, end)
      // Multiply by 1.3 to account for road curves and detours
      setDistance(Math.round(straightDistance * 1.3))
    }
    setIsCalculating(false)
  }

  const calculateStraightLineDistance = (start: Location, end: Location): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = ((end.lat - start.lat) * Math.PI) / 180
    const dLon = ((end.lng - start.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((start.lat * Math.PI) / 180) *
        Math.cos((end.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleStartLocationChange = (location: Location | null) => {
    setStartLocation(location)
    if (location && endLocation) {
      calculateDistance(location, endLocation)
    }
  }

  const handleEndLocationChange = (location: Location | null) => {
    setEndLocation(location)
    if (startLocation && location) {
      calculateDistance(startLocation, location)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!tripName || !startLocation || !endLocation) {
      alert("Please fill in all required fields")
      return
    }

    const newTrip: Trip = {
      id: Date.now().toString(),
      name: tripName,
      startLocation,
      endLocation,
      distance,
      createdAt: new Date().toISOString(),
    }

    onAddTrip(newTrip)

    // Reset form
    setTripName("")
    setStartLocation(null)
    setEndLocation(null)
    setDistance(0)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="tripName">Trip Name *</Label>
        <Input
          id="tripName"
          type="text"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          placeholder="Enter trip name"
          required
        />
      </div>

      <div>
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Start Location *
        </Label>
        <LocationInput
          value={startLocation}
          onChange={handleStartLocationChange}
          placeholder="Enter start location (e.g., Matara, Sri Lanka)"
        />
      </div>

      <div>
        <Label className="flex items-center gap-2">
          <Navigation className="w-4 h-4" />
          End Location *
        </Label>
        <LocationInput value={endLocation} onChange={handleEndLocationChange} placeholder="Enter end location" />
      </div>

      <div>
        <Label htmlFor="distance">Allocated Distance (km)</Label>
        <Input
          id="distance"
          type="number"
          value={distance}
          readOnly
          className="bg-gray-100"
          placeholder={isCalculating ? "Calculating..." : "Distance will be calculated automatically"}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!tripName || !startLocation || !endLocation || isCalculating}>
        {isCalculating ? "Calculating Distance..." : "Add Trip"}
      </Button>
    </form>
  )
}
