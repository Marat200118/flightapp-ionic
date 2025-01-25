import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-live-flight-path-map',
  standalone: true,
  template: `<div id="live-map" style="height: 100%; width: 100%;"></div>`,
  styleUrls: ['./live-flight-map.component.scss'],
})
export class LiveFlightPathMapComponent implements OnInit, OnChanges, OnDestroy {
  @Input() flightPath: { latitude: number; longitude: number; timestamp: number }[] = [];
  @Input() planePosition: { latitude: number; longitude: number } | null = null;
  @Input() scheduledDeparture: number | null = null; // Input for scheduledDeparture
  @Input() previousFlightDuration: number | null = null; // Input for previousFlightDuration

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
    if (changes['flightPath']) {
      console.log('Updated Flight Path:', this.flightPath);
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
    if (!this.map || !this.planePosition) return;

    const bearing = this.calculateBearing();

    const planeIcon = L.divIcon({
      html: `<div style="transform: rotate(${bearing - 90}deg);">
              <img src="assets/airplane-outline.svg" style="width: 32px; height: 32px;">
            </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (!this.planeMarker) {
      this.planeMarker = L.marker([this.planePosition.latitude, this.planePosition.longitude], {
        icon: planeIcon,
      }).addTo(this.map);
    } else {
      this.planeMarker.setLatLng([this.planePosition.latitude, this.planePosition.longitude]);
      this.planeMarker.setIcon(planeIcon);
    }

    // Optionally, move the map to follow the plane
    this.map.setView([this.planePosition.latitude, this.planePosition.longitude], 10, { animate: true });
  }

   private calculateBearing(): number {
    if (!this.planePosition || this.flightPath.length < 2) return 0;

    const nextIndex = this.flightPath.findIndex(
      (point) =>
        point.latitude === this.planePosition?.latitude &&
        point.longitude === this.planePosition?.longitude
    );

    if (nextIndex === -1 || nextIndex >= this.flightPath.length - 1) return 0;

    const current = this.planePosition;
    const next = this.flightPath[nextIndex + 1];

    const lat1 = (current.latitude * Math.PI) / 180;
    const lon1 = (current.longitude * Math.PI) / 180;
    const lat2 = (next.latitude * Math.PI) / 180;
    const lon2 = (next.longitude * Math.PI) / 180;

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;

    return (bearing + 360) % 360; // Normalize bearing to 0-360
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
