import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  username: string;
  email: string;
  nome: string;
  cognome: string;
  societa?: string;
}

export interface ProfiloUtente extends User {
  telefono?: string;
  dataNascita?: string;
  sesso?: string;
}

export interface AttivitaRecente {
  id: number;
  date: string;
  activity: string;
  details: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private apiServerUrl = environment.apiServerUrl;
  private currentUser: User | null = null;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Recupera utente da localStorage o sessionStorage se presente
    const savedUser = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  login(username: string, password: string, rememberMe: boolean = false): Observable<any> {
    const url = `${this.apiServerUrl}api/login`;
    return this.http.post<any>(url, { username, password }).pipe(
      tap(response => {
        const token = response.token ?? response.accessToken ?? response.jwt;
        const user = response.user ?? response;
        if (token && user) {
          this.setAuthData(token, this.normalizeUser(user, username), rememberMe);
        }
      })
    );
  }

  private normalizeUser(data: any, username: string): User {
    return {
      id: data.id ?? 0,
      username: data.username ?? username,
      email: data.email ?? (username.includes('@') ? username : username + '@example.com'),
      nome: data.nome ?? data.firstName ?? '',
      cognome: data.cognome ?? data.lastName ?? '',
      societa: data.societa
    };
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    const user = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
    
    if (token && user) {
      if (!this.currentUser) {
        this.currentUser = JSON.parse(user);
      }
      return true;
    }
    
    return false;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setAuthData(token: string, user: User, rememberMe: boolean): void {
    this.currentUser = user;
    if (rememberMe) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  resetPassword(email: string): Observable<any> {
    // TODO: Implementare chiamata API reale
    return of({
      success: true,
      message: 'Email di recupero inviata'
    });
  }

  getProfiloUtente(): Observable<ProfiloUtente> {
    return this.http.get<ProfiloUtente>(`${this.apiUrl}/utente/profilo`);
  }

  getAttivitaRecenti(): Observable<AttivitaRecente[]> {
    return this.http.get<AttivitaRecente[]>(`${this.apiUrl}/utente/attivita`);
  }
}

