import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of, switchMap, map } from 'rxjs';
import { Router } from '@angular/router';
import { Personal } from '../models/personal.model';

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = 'http://localhost:3000'; // Update with your NestJS API URL
  private tokenKey = 'landwash_token';

  private currentUserSubject = new BehaviorSubject<Personal | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    console.log('🔑 AuthService: Constructor called');
    console.log('🔑 AuthService: Token in localStorage:', localStorage.getItem(this.tokenKey));

    // Load user data if token exists
    if (this.isLoggedIn()) {
      console.log('🔑 AuthService: Token found, loading user data...');
      // Don't logout on error during initial load
      this.loadCurrentUserSilently();
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
          // Load user data after successful login
          this.loadCurrentUser();
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): Personal | null {
    return this.currentUserSubject.value;
  }

  loadCurrentUser(): void {
    const token = this.getToken();
    console.log('🔑 loadCurrentUser: Token:', token);
    if (token) {
      console.log('🔑 loadCurrentUser: Fetching user from /personals/me...');
      // The auth interceptor will add the Authorization header automatically
      this.http.get<Personal>(`${this.apiUrl}/personals/me`).subscribe({
        next: (user) => {
          console.log('🔑 loadCurrentUser: User data received:', user);
          this.currentUserSubject.next(user);
        },
        error: (err) => {
          console.error('🔑 loadCurrentUser: Error loading user data:', err);
          // If error loading user, clear session
          this.logout();
        },
      });
    }
  }

  // Load user data without logout on error (for initial page load)
  private loadCurrentUserSilently(): void {
    const token = this.getToken();
    console.log('🔑 loadCurrentUserSilently: Token:', token);
    if (token) {
      console.log('🔑 loadCurrentUserSilently: Fetching user from /personals/me...');
      this.http.get<Personal>(`${this.apiUrl}/personals/me`).subscribe({
        next: (user) => {
          console.log('🔑 loadCurrentUserSilently: User data received:', user);
          this.currentUserSubject.next(user);
        },
        error: (err) => {
          console.error('🔑 loadCurrentUserSilently: Error loading user data (not logging out):', err);
          // Don't logout on error during initial load
        }
      });
    }
  }

  refreshUserData(): Observable<Personal | null> {
    const token = this.getToken();
    console.log('🔑 refreshUserData: Called with token:', token);

    if (!token) {
      return of(null);
    }

    // Return the HTTP call directly so guards can wait for it
    return this.http.get<Personal>(`${this.apiUrl}/personals/me`).pipe(
      tap(user => {
        console.log('🔑 refreshUserData: User data received:', user);
        this.currentUserSubject.next(user);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // Method to check if user is admin (async version that fetches fresh data)
  checkIsAdmin(): Observable<boolean> {
    console.log('🔑 checkIsAdmin: Called');
    if (!this.isLoggedIn()) {
      console.log('🔑 checkIsAdmin: Not logged in, returning false');
      return of(false);
    }

    const user = this.getCurrentUser();
    console.log('🔑 checkIsAdmin: Current user:', user);
    if (user) {
      const isAdmin = user.role === 'admin';
      console.log('🔑 checkIsAdmin: User role is', user.role, '- isAdmin?', isAdmin);
      return of(isAdmin);
    }

    console.log('🔑 checkIsAdmin: No cached user, refreshing data...');
    // If no user data cached, fetch it
    return this.refreshUserData().pipe(
      map((user) => {
        const isAdmin = user?.role === 'admin' || false;
        console.log('🔑 checkIsAdmin: After refresh - user:', user, 'isAdmin?', isAdmin);
        return isAdmin;
      })
    );
  }
}
