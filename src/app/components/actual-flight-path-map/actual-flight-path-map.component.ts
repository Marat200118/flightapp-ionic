// actual-flight-path-map.component.ts

import { Component, Input, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-actual-flight-path-map',
  standalone: true,
  template: `<div id="map"></div>`,
  styleUrls: ['./actual-flight-path-map.component.scss'],
})
export class ActualFlightPathMapComponent implements OnInit {
  @Input() flightPath: { latitude: number; longitude: number }[] = [];

  private map: L.Map | undefined;

  ngOnInit(): void {
    if (!this.flightPath || this.flightPath.length === 0) {
      console.error('No flight path provided.');
      return;
    }

    const isValidPath = this.flightPath.every(
      (point) =>
        typeof point.latitude === 'number' && typeof point.longitude === 'number'
    );

    if (!isValidPath) {
      console.error('Invalid flight path data:', this.flightPath);
      return;
    }

    this.initializeMap();
    this.plotFlightPath();
  }


  private initializeMap(): void {
    this.map = L.map('map').setView([
      this.flightPath[0].latitude,
      this.flightPath[0].longitude,
    ], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 5,
      maxZoom: 18,
    }).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);

  }

  private plotFlightPath(): void {
    if (!this.map) return;

    const polylineCoordinates = this.flightPath.map((point) => [
      point.latitude,
      point.longitude,
    ] as [number, number]);

    const flightPathPolyline = L.polyline(polylineCoordinates, {
      color: 'blue',
      weight: 4,
    });

    flightPathPolyline.addTo(this.map);

    this.map.fitBounds(flightPathPolyline.getBounds());
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
