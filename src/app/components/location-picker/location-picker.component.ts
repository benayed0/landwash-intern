import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';
import { LocationService, LocationSearchResult, SelectedLocation } from '../../services/location.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.css']
})
export class LocationPickerComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() initialLocation?: SelectedLocation | null;
  @Input() placeholder: string = 'Rechercher une adresse...';
  @Output() locationSelected = new EventEmitter<SelectedLocation>();

  private map!: L.Map;
  private marker?: L.Marker;
  private searchSubject = new Subject<string>();
  private subscription = new Subscription();

  searchQuery = signal<string>('');
  searchResults = signal<LocationSearchResult[]>([]);
  showSuggestions = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  currentSelection = signal<SelectedLocation | null>(null);

  constructor(private locationService: LocationService) {}

  ngOnInit() {
    this.initializeMap();
    this.setupSearch();

    if (this.initialLocation) {
      this.setLocation(this.initialLocation.lat, this.initialLocation.lng, this.initialLocation.address);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap() {
    // Default to Tunisia coordinates
    const defaultLat = 36.8065;
    const defaultLng = 10.1815;
    const defaultZoom = 10;

    this.map = L.map(this.mapContainer.nativeElement).setView([defaultLat, defaultLng], defaultZoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Fix Leaflet default icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Add click event to map
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.setLocationFromCoordinates(lat, lng);
    });
  }

  private setupSearch() {
    const searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.isLoading.set(true);
        return this.locationService.searchLocations(query);
      })
    ).subscribe(results => {
      this.searchResults.set(results);
      this.showSuggestions.set(results.length > 0);
      this.isLoading.set(false);
    });

    this.subscription.add(searchSubscription);
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const query = target.value;
    this.searchQuery.set(query);

    if (query.length >= 3) {
      this.searchSubject.next(query);
    } else {
      this.searchResults.set([]);
      this.showSuggestions.set(false);
      this.isLoading.set(false);
    }
  }

  onSuggestionClick(result: LocationSearchResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    this.setLocation(lat, lng, result.display_name);
    this.hideSuggestions();
  }

  private setLocation(lat: number, lng: number, address: string) {
    // Update map view
    this.map.setView([lat, lng], 15);

    // Remove existing marker
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Add new marker
    this.marker = L.marker([lat, lng]).addTo(this.map);

    // Update search input
    this.searchQuery.set(address);

    // Store current selection
    this.currentSelection.set({ lat, lng, address });

    // Emit the selected location immediately
    this.locationSelected.emit({ lat, lng, address });
  }

  private setLocationFromCoordinates(lat: number, lng: number) {
    this.isLoading.set(true);

    this.locationService.reverseGeocode(lat, lng).subscribe(address => {
      this.setLocation(lat, lng, address);
      this.isLoading.set(false);
    });
  }

  hideSuggestions() {
    this.showSuggestions.set(false);
  }

  onSearchFocus() {
    if (this.searchResults().length > 0) {
      this.showSuggestions.set(true);
    }
  }

  onSearchBlur() {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }
}