export interface Location {
  name: string
  lat: number
  lng: number
}

export interface Trip {
  id: string
  name: string
  startLocation: Location
  endLocation: Location
  distance: number
  createdAt: string
}
