import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class GeocodingService {

  private backendUrl = 'https://flight-api-backend.vercel.app/api/geoapify';

  constructor(private http: HttpClient) {}

  getLocationInfo(lat: number, lon: number): Observable<any> {
    return this.http.get<any>(`${this.backendUrl}?lat=${lat}&lon=${lon}`);
  }
}
