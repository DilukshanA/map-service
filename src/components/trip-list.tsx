"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation, Trash2, Calendar } from "lucide-react"
import type { Trip } from "@/types/trip"

interface TripListProps {
  trips: Trip[]
  onSelectTrip: (trip: Trip) => void
  onDeleteTrip: (id: string) => void
  selectedTripId?: string
}

export default function TripList({ trips, onSelectTrip, onDeleteTrip, selectedTripId }: TripListProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No trips created yet. Add your first trip above!</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {trips.map((trip) => (
        <Card
          key={trip.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedTripId === trip.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
          }`}
          onClick={() => onSelectTrip(trip)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{trip.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteTrip(trip.id)
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
              <span className="text-gray-600 line-clamp-1">{trip.startLocation.name}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Navigation className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
              <span className="text-gray-600 line-clamp-1">{trip.endLocation.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-blue-600">{trip.distance} km</span>
              <div className="flex items-center gap-1 text-gray-500">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">{formatDate(trip.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
