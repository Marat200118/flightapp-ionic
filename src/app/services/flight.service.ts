import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FlightService {
  private proxyBaseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private toUnixTimestamp(isoDate: string): number {
    return Math.floor(new Date(isoDate).getTime() / 1000);
  }

  private getIcao24(callsign: string): Observable<any> {
    const url = `${this.proxyBaseUrl}/opensky/states?callsign=${callsign}`;

    return this.http.get(url).pipe(
      catchError((error) => {
        console.error('Error fetching ICAO24:', error);
        return throwError(() => new Error('Failed to fetch ICAO24 from OpenSky API.'));
      })
    );
  }

  getDeparturesWithArrival(
    departureAirport: string,
    startTime: string,
    endTime: string,
    arrivalAirport?: string,
    callsign?: string

  ): Observable<any> {

    const begin = this.toUnixTimestamp(startTime);
    const end = this.toUnixTimestamp(endTime);

    let url = `${this.proxyBaseUrl}/opensky/departures?airport=${departureAirport}&begin=${begin}&end=${end}`;
    
    if (arrivalAirport) {
      url += `&arrivalAirport=${arrivalAirport}`;
    }
    if (callsign) {
      url += `&callsign=${callsign}`;
    }

    return this.http.get(url).pipe(
      catchError((error) => {
        console.error('Error fetching departures:', error);
        return throwError(() => new Error('Failed to fetch departures from OpenSky API.'));
      })
    );
  }



  getFlightPath(icao24: string, time: number): Observable<any> {
    const url = `${this.proxyBaseUrl}/opensky/track?icao24=${icao24}&time=${time}`;
    return this.http.get(url).pipe(
      catchError((error) => {
        console.error('Error fetching flight path:', error);
        return throwError(() => new Error('Failed to fetch flight path from OpenSky API.'));
      })
    );
  }
}