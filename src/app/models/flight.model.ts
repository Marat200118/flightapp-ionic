//flight.model.ts

export interface Flight {
  flightId: string;
  flightDetails: any; 
  previousFlight?: Flight; 
  actualFlightPathId?: string;
  origin?: string; 
  destination?: string; 
  
}
