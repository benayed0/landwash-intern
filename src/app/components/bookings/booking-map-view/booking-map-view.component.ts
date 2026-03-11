import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Booking, BookingStatus, BookingType } from '../../../models/booking.model';
import { LabelService } from '../../../services/label.service';

@Component({
  selector: 'app-booking-map-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-map-view.component.html',
  styleUrls: ['./booking-map-view.component.css'],
})
export class BookingMapViewComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @Input() bookings: Booking[] = [];
  @Output() bookingSelected = new EventEmitter<string>();

  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private labelService = inject(LabelService);
  private previousBookingIds: string[] = [];
  private hasFittedBounds = false;

  private statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    'in-progress': '#c3ff00',
    completed: '#22c55e',
    rejected: '#ef4444',
    canceled: '#6b7280',
  };

  private statusPulse: Record<string, boolean> = {
    pending: true,
    'in-progress': true,
    confirmed: false,
    completed: false,
    rejected: false,
    canceled: false,
  };

  private typeIcons: Record<string, string> = {
    detailing: '🚗',
    salon: '🛌',
    paint_correction: '🎨',
    body_correction: '🔧',
    ceramic_coating: '✨',
  };

  ngAfterViewInit() {
    this.initializeMap();
    this.previousBookingIds = this.bookings.map((b) => b._id).sort();
    this.renderMarkers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['bookings'] && this.map) {
      const currentIds = this.bookings
        .map((b) => b._id)
        .sort()
        .join(',');
      const previousIds = this.previousBookingIds.join(',');

      if (currentIds !== previousIds) {
        this.previousBookingIds = this.bookings.map((b) => b._id).sort();
        this.renderMarkers();
      }
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap() {
    // Default to Tunisia
    const defaultLat = 36.8065;
    const defaultLng = 10.1815;

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
    }).setView([defaultLat, defaultLng], 10);

    // Add zoom control to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Dark-themed map tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(this.map);

    this.markersLayer.addTo(this.map);
  }

  private renderMarkers() {
    this.markersLayer.clearLayers();

    const validBookings = this.bookings.filter(
      (b) => b.coordinates && b.coordinates.length === 2
    );

    if (validBookings.length === 0) return;

    const bounds = L.latLngBounds([]);

    validBookings.forEach((booking) => {
      const [lng, lat] = booking.coordinates;
      const color = this.statusColors[booking.status] || '#6b7280';
      const shouldPulse = this.statusPulse[booking.status] || false;
      const typeIcon = this.typeIcons[booking.type] || '📋';

      const icon = L.divIcon({
        className: 'custom-booking-marker',
        html: `
          <div class="marker-wrapper ${shouldPulse ? 'pulse' : ''}" style="--marker-color: ${color}">
            <div class="marker-pin" style="background: ${color}; box-shadow: 0 0 12px ${color}80;">
              <span class="marker-emoji">${typeIcon}</span>
            </div>
            <div class="marker-shadow"></div>
          </div>
        `,
        iconSize: [40, 52],
        iconAnchor: [20, 52],
        popupAnchor: [0, -52],
      });

      const marker = L.marker([lat, lng], { icon });

      const popupContent = this.buildPopupContent(booking);
      marker.bindPopup(popupContent, {
        className: 'dark-popup',
        maxWidth: 280,
        minWidth: 220,
      });

      marker.on('popupopen', () => {
        const btn = document.querySelector(
          `.popup-view-btn[data-id="${booking._id}"]`
        ) as HTMLElement;
        if (btn) {
          btn.addEventListener('click', () => {
            this.bookingSelected.emit(booking._id!);
          });
        }
      });

      marker.addTo(this.markersLayer);
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid() && !this.hasFittedBounds) {
      this.hasFittedBounds = true;
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }

  private buildPopupContent(booking: Booking): string {
    const statusColor = this.statusColors[booking.status] || '#6b7280';
    const statusLabel = this.labelService.getBookingStatusLabel(booking.status);
    const typeLabel = this.labelService.getBookingTypeLabel(booking.type);
    const typeIcon = this.typeIcons[booking.type] || '📋';
    const date = new Date(booking.date);
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);

    const clientName = booking.userId?.name || 'Client inconnu';
    const address = booking.address || 'Adresse non spécifiée';
    const price = booking.price ? `${booking.price} TND` : 'N/A';

    const teamName =
      booking.teamId && typeof booking.teamId !== 'string'
        ? booking.teamId.name
        : '';

    return `
      <div class="popup-content">
        <div class="popup-header">
          <span class="popup-type">${typeIcon} ${typeLabel}</span>
          <span class="popup-status" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
            ${statusLabel}
          </span>
        </div>
        <div class="popup-body">
          <div class="popup-row">
            <span class="popup-label">Client</span>
            <span class="popup-value">${clientName}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Date</span>
            <span class="popup-value">${formattedDate}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Prix</span>
            <span class="popup-value popup-price">${price}</span>
          </div>
          ${teamName ? `
          <div class="popup-row">
            <span class="popup-label">Équipe</span>
            <span class="popup-value">${teamName}</span>
          </div>
          ` : ''}
          <div class="popup-address">
            <span class="popup-label">Adresse</span>
            <span class="popup-value">${address}</span>
          </div>
        </div>
        <button class="popup-view-btn" data-id="${booking._id}">
          Voir les détails
        </button>
      </div>
    `;
  }
}
