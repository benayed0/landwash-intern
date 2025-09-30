import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  tap,
  of,
  map,
  shareReplay,
  catchError,
} from 'rxjs';
import { Router } from '@angular/router';
import { Personal } from '../models/personal.model';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = environment.apiUrl; // Update with your NestJS API URL
  private tokenKey = 'landwash_token';

  private currentUserSubject = new BehaviorSubject<Personal | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Cache the API observable to prevent multiple simultaneous calls
  private userApiCall$: Observable<Personal | null> | null = null;

  constructor() {
    console.log('🔑 AuthService: Constructor called');
    console.log(
      '🔑 AuthService: Token in localStorage:',
      localStorage.getItem(this.tokenKey)
    );

    // Load user data if token exists
    if (this.isLoggedIn()) {
      console.log('🔑 AuthService: Token found, loading user data...');
      // Don't logout on error during initial load
      this.loadUserData().subscribe({
        error: (err) => {
          console.error(
            '🔑 AuthService: Error loading initial user data:',
            err
          );
        },
      });
    } else {
      console.log('🔑 AuthService: No token found');
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/personals/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.token);
          // Clear cache and load fresh user data after login
          this.userApiCall$ = null;
          this.loadUserData().subscribe();
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
    this.userApiCall$ = null; // Clear cached API call
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): Personal | null {
    return this.currentUserSubject.value;
  }

  // Core method to load user data with caching
  private loadUserData(forceRefresh = false): Observable<Personal | null> {
    const token = this.getToken();

    if (!token) {
      console.log('🔑 loadUserData: No token available');
      return of(null);
    }

    // If we have cached data and not forcing refresh, return it
    const currentUser = this.getCurrentUser();
    if (currentUser && !forceRefresh) {
      console.log('🔑 loadUserData: Returning cached user data');
      return of(currentUser);
    }

    // If we already have an ongoing API call and not forcing refresh, return it
    if (this.userApiCall$ && !forceRefresh) {
      console.log('🔑 loadUserData: Returning existing API call');
      return this.userApiCall$;
    }

    // Make a new API call and cache it
    console.log('🔑 loadUserData: Making new API call to /personals/me');
    this.userApiCall$ = this.http
      .get<Personal>(`${this.apiUrl}/personals/me`)
      .pipe(
        tap((user) => {
          console.log('🔑 loadUserData: User data received:', user);
          this.currentUserSubject.next(user);
        }),
        shareReplay(1), // Share the result among multiple subscribers
        catchError((err) => {
          console.error('🔑 loadUserData: Error loading user data:', err);
          this.userApiCall$ = null; // Clear cache on error
          return of(null);
        })
      );

    return this.userApiCall$;
  }

  loadCurrentUser(): void {
    console.log('🔑 loadCurrentUser: Called (forced refresh)');
    this.userApiCall$ = null; // Clear cache to force refresh
    this.loadUserData(true).subscribe({
      next: (user) => {
        if (!user) {
          this.logout();
        }
      },
      error: (err) => {
        console.error('🔑 loadCurrentUser: Error loading user data:', err);
        this.logout();
      },
    });
  }

  refreshUserData(): Observable<Personal | null> {
    console.log('🔑 refreshUserData: Called');
    return this.loadUserData(false); // Use cache if available
  }

  // Force refresh user data (bypass cache)
  forceRefreshUserData(): Observable<Personal | null> {
    console.log('🔑 forceRefreshUserData: Called');
    this.userApiCall$ = null; // Clear the cached API call
    return this.loadUserData(true);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // Method to check if user is admin (uses cache)
  checkIsAdmin(): Observable<boolean> {
    console.log('🔑 checkIsAdmin: Called');
    if (!this.isLoggedIn()) {
      console.log('🔑 checkIsAdmin: Not logged in, returning false');
      return of(false);
    }

    return this.loadUserData().pipe(
      map((user) => {
        const isAdmin = user?.role === 'admin' || false;
        console.log(
          '🔑 checkIsAdmin: User role is',
          user?.role,
          '- isAdmin?',
          isAdmin
        );
        return isAdmin;
      })
    );
  }

  // Method to check if user is worker (uses cache)
  checkIsWorker(): Observable<boolean> {
    console.log('🔑 checkIsWorker: Called');
    if (!this.isLoggedIn()) {
      console.log('🔑 checkIsWorker: Not logged in, returning false');
      return of(false);
    }

    return this.loadUserData().pipe(
      map((user) => {
        const isWorker = user?.role === 'worker' || false;
        console.log(
          '🔑 checkIsWorker: User role is',
          user?.role,
          '- isWorker?',
          isWorker
        );
        return isWorker;
      })
    );
  }

  // Get user's team ID if they're part of a team
  getUserTeamId(): string | null {
    const user = this.getCurrentUser();
    // Assuming the user has a teamId field if they're assigned to a team
    return (user as any)?.teamId || null;
  }
}
