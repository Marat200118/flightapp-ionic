//flight.model.ts

export interface Flight {
  flightId: string; // Unique identifier for the flight
  flightDetails: any; // Details of the flight (from FlightAware or any other source)
  previousFlightId?: string; // Reference to the previous flight (optional)
  actualFlightPathId?: string; // Reference to the actual flight path (optional)
  origin?: string; // Origin airport code
  destination?: string; // Destination airport code
  
}
