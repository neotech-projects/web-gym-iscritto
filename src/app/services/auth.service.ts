import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
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
  societaNome?: string;
}

export interface ProfiloUtente extends User {
  telefono?: string;
  dataNascita?: string;
  sesso?: string;
  societaNome?: string;
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
  private apiUrl = environment.apiServerUrl;
  private currentUser: User | null = null;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  /** Chiavi esplicite usate anche da accesso-porta / integrazioni */
  private readonly UTENTE_ID_KEY = 'utenteId';
  private readonly AUTH_TOKEN_KEY = 'authToken';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const savedUser = localStorage.getItem(this.USER_KEY);
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (this.currentUser?.id != null && token) {
          localStorage.setItem(this.AUTH_TOKEN_KEY, token);
          localStorage.setItem(this.UTENTE_ID_KEY, String(this.currentUser.id));
        }
      } catch {
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<any> {
    const url = `${this.apiUrl}/api/utenti/login`;
    return this.http.post<any>(url, { email, password }).pipe(
      tap(response => {
        const token = response.token ?? response.accessToken ?? response.jwt;
        if (!token || !response.email) return;
        const user: User = {
          id: response.id ?? 0,
          username: response.email,
          email: response.email,
          nome: response.nome ?? '',
          cognome: response.cognome ?? ''
        };
        this.setAuthData(token, user, rememberMe);
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.UTENTE_ID_KEY);
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/utenti/login']);
  }

  /** Verifica che in localStorage esistano sia il token sia i dati utente (con id). */
  isAuthenticated(): boolean {
    return this.hasValidAuth();
  }

    /** Controllo stretto: token e utente (con id) devono essere presenti in localStorage. */
  hasValidAuth(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!token || !userJson) return false;
    try {
      const user = JSON.parse(userJson) as User;
      if (user == null || (user as any).id == null) return false;
      if (!this.currentUser) this.currentUser = user;
      return true;
    } catch {
      return false;
    }
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) this.loadUserFromStorage();
    return this.currentUser;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Pulisce auth e reindirizza al login. Usato da guard e interceptor quando i dati non sono validi. */
  clearAuthAndRedirectToLogin(): void {
    this.currentUser = null;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.UTENTE_ID_KEY);
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/utenti/login']);
  }

  private setAuthData(token: string, user: User, _rememberMe: boolean): void {
    this.currentUser = user;
    // Salvataggio sempre in localStorage: token, nome, cognome e dati utente senza scadenza
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.UTENTE_ID_KEY, String(user.id));
  }

  resetPassword(email: string): Observable<any> {
    // TODO: Implementare chiamata API reale
    return of({
      success: true,
      message: 'Email di recupero inviata'
    });
  }

  getProfiloUtente(utenteId: number): Observable<ProfiloUtente> {
    const params = new HttpParams().set('utenteId', String(utenteId));
    const headers = new HttpHeaders().set('authToken', this.getToken() ?? '');
    return this.http.get<ProfiloUtente>(`${this.apiUrl}/api/utenti/profilo`, { params, headers });
  }

  getAttivitaRecenti(): Observable<AttivitaRecente[]> {
    return this.http.get<AttivitaRecente[]>(`${this.apiUrl}/utente/attivita`);
  }

  cambiaPassword(utenteId: number, vecchiaPassword: string, nuovaPassword: string): Observable<any> {
    const params = new HttpParams().set('utenteId', String(utenteId));
    return this.http.put<any>(`${this.apiUrl}/api/utenti/cambia-password`, { vecchiaPassword, nuovaPassword}, { params });
  }

  modificaProfilo(utenteId: number, email: string, telefono: string): Observable<any> {
    const params = new HttpParams().set('utenteId', String(utenteId));
    return this.http.put<any>(`${this.apiUrl}/api/utenti/modifica-profilo`, { email, telefono }, { params });
  }
  
}

