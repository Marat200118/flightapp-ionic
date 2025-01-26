//flight.model.ts

export interface Flight {
  flightId: string;
  flightDetails: any; 
  previousFlight?: {
    flightPath?: any[];
    estDepartureAirport?: string;
    estArrivalAirport?: string;
    callsign?: string;
  };
  actualFlightPathId?: string;
  origin?: string; 
  destination?: string; 
  
}
