import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-live-flight-path-map',
  standalone: true,
  template: `<div id="live-map" style="height: 100%; width: 100%;"></div>`,
  styleUrls: ['./live-flight-map.component.scss'],
})
export class LiveFlightPathMapComponent implements OnInit, OnChanges, OnDestroy {
  @Input() flightPath: { latitude: number; longitude: number }[] = [];
  @Input() planePosition: { latitude: number; longitude: number } | null = null;

  private map: L.Map | undefined;
  private planeMarker: L.Marker | undefined;

  ngOnInit(): void {
    if (!this.flightPath || this.flightPath.length === 0) {
      console.error('No flight path provided.');
      return;
    }

    this.initializeMap();
    this.plotFlightPath();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Changes detected:', changes);
    if (changes['flightPath']) {
      console.log('Updated Flight Path:', this.flightPath);
    }
    if (changes['planePosition']) {
      console.log('Updated Plane Position:', this.planePosition);
    }
    if (changes['planePosition'] && this.planePosition) {
      this.updatePlaneMarker();
    }
  }

  private initializeMap(): void {
    this.map = L.map('live-map').setView(
      [this.flightPath[0].latitude, this.flightPath[0].longitude],
      10
    );

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

  private updatePlaneMarker(): void {
    console.log('Updating plane marker:', this.planePosition);

    if (!this.map || !this.planePosition) return;

    if (this.planeMarker) {
      this.map.removeLayer(this.planeMarker);
    }

    this.planeMarker = L.marker(
      [this.planePosition.latitude, this.planePosition.longitude],
      {
        icon: L.icon({
          iconUrl: 'assets/airplane-outline.svg',
          iconSize: [32, 32],
        }),
      }
    ).addTo(this.map);

    this.map.setView([this.planePosition.latitude, this.planePosition.longitude], 10);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
