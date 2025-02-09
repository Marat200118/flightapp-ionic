//flight.service.ts

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FlightService {
   private proxyBaseUrl = 'https://flight-api-backend.vercel.app/api';

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
    startTime: number,
    endTime: number, 
    arrivalAirport?: string,
    callsign?: string
  ): Observable<any> {
    const url = new URL(`${this.proxyBaseUrl}/opensky/departures`);
    url.searchParams.append('airport', departureAirport);
    url.searchParams.append('begin', startTime.toString());
    url.searchParams.append('end', endTime.toString());  

    if (arrivalAirport) {
      url.searchParams.append('arrivalAirport', arrivalAirport);
    }
    if (callsign) {
      url.searchParams.append('callsign', callsign);
    }

    return this.http.get(url.toString()).pipe(
      catchError((error) => {
        console.error('Error fetching departures:', error);
        return throwError(() => new Error('Failed to fetch departures from OpenSky API.'));
      })
    );
  }

  getArrivalsAtAirport(
    airport: string,
    startTime: number,
    endTime: number
  ): Observable<any> {
    const url = `${this.proxyBaseUrl}/opensky/arrivals?airport=${airport}&begin=${startTime}&end=${endTime}`;
    return this.http.get(url).pipe(
      catchError((error) => {
        console.error('Error fetching arrivals:', error);
        return throwError(() => new Error('Failed to fetch arrivals from OpenSky API.'));
      })
    );
  }

  getHistoricalFlightTrack(flightId: string): Observable<any> {
    const url = `${this.proxyBaseUrl}/aeroapi/history/flights/${flightId}/track`;

    return this.http.get(url).pipe(
      catchError((error) => {
        console.error('Error fetching historical flight track:', error);
        return throwError(() => new Error('Failed to fetch historical flight track.'));
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