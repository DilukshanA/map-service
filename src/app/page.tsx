"use client"

import { useState, useEffect } from "react"
import TripForm from "@/components/trip-form"
import TripList from "@/components/trip-list"
import MapView from "@/components/map-view"
import type { Trip } from "@/types/trip"

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  useEffect(() => {
    // Load trips from localStorage on component mount
    const savedTrips = localStorage.getItem("travel-trips")
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips))
    }
  }, [])

  const addTrip = (trip: Trip) => {
    const updatedTrips = [...trips, trip]
    setTrips(updatedTrips)
    localStorage.setItem("travel-trips", JSON.stringify(updatedTrips))
  }

  const deleteTrip = (id: string) => {
    const updatedTrips = trips.filter((trip) => trip.id !== id)
    setTrips(updatedTrips)
    localStorage.setItem("travel-trips", JSON.stringify(updatedTrips))
    if (selectedTrip?.id === id) {
      setSelectedTrip(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Travel Trip Planner</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form and Trip List */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Create New Trip</h2>
              <TripForm onAddTrip={addTrip} />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Trips</h2>
              <TripList
                trips={trips}
                onSelectTrip={setSelectedTrip}
                onDeleteTrip={deleteTrip}
                selectedTripId={selectedTrip?.id}
              />
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Map View</h2>
            <MapView selectedTrip={selectedTrip} />
          </div>
        </div>
      </div>
    </div>
  )
}
