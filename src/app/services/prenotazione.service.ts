import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Prenotazione {
  id: number;
  data: string;
  oraInizio: string;
  oraFine: string;
  macchinari: string[];
  durata: string;
  stato: 'Confermata' | 'Annullata' | 'Completata';
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

  getPrenotazioni(): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.apiUrl}/prenotazioni`);
  }

  getProssimePrenotazioni(): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.apiUrl}/dashboard/prenotazioni`);
  }

  creaPrenotazione(prenotazione: Partial<Prenotazione>): Observable<Prenotazione> {
    return this.http.post<Prenotazione>(`${this.apiUrl}/prenotazioni`, prenotazione);
  }

  annullaPrenotazione(id: number): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/prenotazioni/${id}`)
      .pipe(
        map(response => response.success)
      );
  }

  getStatistiche(): Observable<{ prenotazioni: number; allenamenti: number }> {
    return this.http.get<{ prenotazioni: number; allenamenti: number }>(`${this.apiUrl}/dashboard/stats`);
  }

  getPrenotazioniGenerali(): Observable<PrenotazioneGenerale[]> {
    return this.http.get<PrenotazioneGenerale[]>(`${this.apiUrl}/prenotazioni/generali`);
  }

  getStoricoPrenotazioni(): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.apiUrl}/prenotazioni/storico`);
  }
}

