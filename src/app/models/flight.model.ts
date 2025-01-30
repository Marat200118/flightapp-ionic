//flight.model.ts

export interface Flight {
  flightId: string;
  flightDetails: any; 
  userId: string;
  previousFlight?: {
    flightPath?: any[];
    estDepartureAirport?: string;
    estArrivalAirport?: string;
    callsign?: string;
  };
  actualFlight?: {
    firstSeen: number;
    lastSeen: number;
    flightPath: { latitude: number; longitude: number }[];
  };
  origin?: string; 
  destination?: string; 
  
}
