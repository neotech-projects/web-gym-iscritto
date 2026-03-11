import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CheckPrenotazioneResult {
  success: true;
}

export interface Prenotazione {
  id: number;
  data: string;
  oraInizio?: string;
  oraFine?: string;
  durata?: string;
  durataMinuti?: number;
  stato: 'Confermata' | 'Annullata' ;
}

export interface PrenotazioneGenerale extends Prenotazione {
  utente: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrenotazioneService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getPrenotazioni(utenteId: number, authToken: string): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.apiUrl}/api/dashboard/mie-prenotazioni`, {
      params: { utenteId },
      headers: { 'authToken': authToken }
    });
  }

  getProssimePrenotazioni(utenteId: number, authToken: string): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.apiUrl}/api/dashboard/mie-prenotazioni`, {
      params: { utenteId },
      headers: { 'authToken': authToken }
    });
  }

  creaPrenotazione(utenteId: number, prenotazione: Partial<Prenotazione>): Observable<Prenotazione> {
    return this.http.post<Prenotazione>(`${this.apiUrl}/api/prenotazioni`, prenotazione, { params: { utenteId } });
  }

  annullaPrenotazione(idPrenotazione: number): Observable<Prenotazione> {
    return this.http.patch<Prenotazione>(`${this.apiUrl}/api/prenotazioni`, null, { params: { idPrenotazione } });
  }

  getStatistiche(utenteId: number, authToken: string): Observable<{ prenotazioni: number; allenamenti: number }> {
    return this.http.get<{ prenotazioni: number; allenamenti: number }>(`${this.apiUrl}/api/dashboard/statistiche`, {
      params: { utenteId },
      headers: { 'authToken': authToken }
    });
  }

  getPrenotazioniGenerali(): Observable<PrenotazioneGenerale[]> {
    return this.http.get<PrenotazioneGenerale[]>(`${this.apiUrl}/api/prenotazioni/generali`);
  }

  getStoricoPrenotazioni(utenteId: number, authToken: string): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.apiUrl}/api/prenotazioni/storico`, {
      params: { utenteId },
      headers: { 'authToken': authToken }
    });
  }

  checkPrenotazione(uuid: string, utenteId: number, authToken: string): Observable<CheckPrenotazioneResult> {
    return this.http.post(
      `${this.apiUrl}/api/prenotazioni/check-prenotazione`,
      null,
      {
        params: { uuid, utenteId: String(utenteId) },
        headers: { authToken },
        observe: 'response',
        responseType: 'text'
      }
    ).pipe(
      map(res => {
        if (res.status === 200 && res.body === 'ok') {
          return { success: true as const };
        }
        throw new Error(res.body?.trim() || 'Errore di sistema');
      }),
      catchError(err => {
        const message = (typeof err.error === 'string' && err.error.trim())
          ? err.error.trim()
          : (err.message || 'Errore di sistema');
        return throwError(() => new Error(message));
      })
    );
  }
}

