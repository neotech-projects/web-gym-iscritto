import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

  getPrenotazioni(utenteId: number): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.apiUrl}/api/dashboard/mie-prenotazioni`, { params: { utenteId } });
  }

  getProssimePrenotazioni(utenteId: number): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.apiUrl}/api/dashboard/mie-prenotazioni`, { params: { utenteId } });
  }

  creaPrenotazione(utenteId: number, prenotazione: Partial<Prenotazione>): Observable<Prenotazione> {
    return this.http.post<Prenotazione>(`${this.apiUrl}/api/prenotazioni`, prenotazione, { params: { utenteId } });
  }

  annullaPrenotazione(idPrenotazione: number): Observable<Prenotazione> {
    return this.http.patch<Prenotazione>(`${this.apiUrl}/api/prenotazioni`, null, { params: { idPrenotazione } });
  }

  getStatistiche(utenteId: number): Observable<{ prenotazioni: number; allenamenti: number }> {
    return this.http.get<{ prenotazioni: number; allenamenti: number }>( `${this.apiUrl}/api/dashboard/statistiche`, { params: { utenteId } }
    );
  }

  getPrenotazioniGenerali(): Observable<PrenotazioneGenerale[]> {
    return this.http.get<PrenotazioneGenerale[]>(`${this.apiUrl}/api/prenotazioni/generali`);
  }

  getStoricoPrenotazioni(utenteId: number): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.apiUrl}/api/prenotazioni/storico`, { params: { utenteId } });
  }

  /**
   * Restituisce l'URL per la verifica prenotazione (check QR).
   * Usato dal form POST che invia uuid e utenteId; il backend reindirizza poi a accesso-porta con esito e messaggio.
   */
  getCheckPrenotazioneUrl(uuid: string, utenteId: number): string {
    const params = new URLSearchParams({ uuid, utenteId: String(utenteId) });
    return `${this.apiUrl}/api/prenotazioni/check-prenotazione?${params.toString()}`;
  }
}

