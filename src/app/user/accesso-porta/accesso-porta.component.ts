import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PrenotazioneService } from '../../services/prenotazione.service';

@Component({
  selector: 'app-accesso-porta',
  templateUrl: './accesso-porta.component.html',
  styleUrls: ['./accesso-porta.component.css']
})
export class AccessoPortaComponent implements OnInit {
  /** Stato: 'loading' = verifica in corso, 'result' = esito da backend, 'no-user' = non loggato, 'no-uuid' = nessun QR */
  state: 'loading' | 'result' | 'no-user' | 'no-uuid' = 'no-uuid';
  /** Esito dalla redirect: 'ok' | 'ko' */
  esito: 'ok' | 'ko' | null = null;
  /** Messaggio dalla redirect (es. "Porta aperta" o messaggio di errore) */
  messaggio: string = '';

  badgeClass: string = 'badge-success';
  badgeText: string = 'PORTA APERTA';
  imagePath: string = 'assets/images/portaaperta.png';
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private prenotazioneService: PrenotazioneService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const uuid_door = params['uuid_door'] ?? params['UUID_DOOR'] ?? null;
      const esitoParam = params['esito'];
      const messaggioParam = params['messaggio'] ?? '';

      // Arrivo dalla redirect del backend: mostra esito e messaggio
      if (esitoParam === 'ok' || esitoParam === 'ko') {
        this.state = 'result';
        this.esito = esitoParam;
        this.messaggio = esitoParam === 'ok'
          ? (decodeURIComponent(messaggioParam || '') || 'Porta aperta. Benvenuto in palestra!')
          : this.getMessageForError(decodeURIComponent(messaggioParam || ''));
        this.applyResultView();
        return;
      }

      // Arrivo con solo uuid: header authToken e/o cookie di sessione (withCredentials)
      if (uuid_door) {
        const { utenteId, authToken } = this.readUtenteIdAndAuthTokenFromStorage();
        this.state = 'loading';
        this.prenotazioneService.checkPrenotazione(uuid_door, utenteId, authToken).subscribe({
          next: () => {
            this.state = 'result';
            this.esito = 'ok';
            this.messaggio = 'Porta aperta. Benvenuto in palestra!';
            this.applyResultView();
          },
          error: (err: unknown) => {
            if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
              this.state = 'no-user';
              this.message = 'Effettua il login per verificare l\'accesso.';
              this.badgeClass = 'badge-warning';
              this.badgeText = 'ACCESSO NEGATO';
              this.imagePath = 'assets/images/portachiusa.png';
              return;
            }
            const msg =
              err instanceof HttpErrorResponse && typeof err.error === 'string'
                ? err.error.trim()
                : err instanceof Error
                  ? err.message
                  : 'Errore di sistema';
            this.state = 'result';
            this.esito = 'ko';
            this.messaggio = this.getMessageForError(msg);
            this.applyResultView();
          }
        });
        return;
      }

      // Nessun uuid: invito a scansionare il QR
      this.state = 'no-uuid';
      this.message = 'Scansiona il QR code all\'ingresso per verificare l\'accesso.';
      this.badgeClass = 'badge-warning';
      this.badgeText = 'IN ATTESA';
      this.imagePath = 'assets/images/portachiusa.png';
    });
  }

  /**
   * AuthService + chiavi `utenteId` / `authToken` (scritte al login).
   * L’interceptor non blocca `check-prenotazione`, ma così la pagina ha sempre i valori giusti.
   */
  private readUtenteIdAndAuthTokenFromStorage(): { utenteId: number | null; authToken: string | null } {
    let utenteId = this.authService.getCurrentUser()?.id ?? null;
    if (utenteId == null) {
      const raw = localStorage.getItem('utenteId');
      if (raw?.trim()) {
        const n = Number(raw);
        if (Number.isFinite(n)) utenteId = n;
      }
    }
    const authToken =
      this.authService.getToken() ??
      localStorage.getItem('authToken')?.trim() ??
      localStorage.getItem('auth_token')?.trim() ??
      null;
    return { utenteId, authToken };
  }

  private applyResultView(): void {
    if (this.esito === 'ok') {
      this.badgeClass = 'badge-success';
      this.badgeText = 'PORTA APERTA';
      this.imagePath = 'assets/images/portaaperta.png';
      this.message = this.messaggio || 'Accesso autorizzato. Benvenuto in palestra!';
    } else {
      this.badgeClass = 'badge-warning';
      this.badgeText = 'PORTA CHIUSA';
      this.imagePath = 'assets/images/portachiusa.png';
      this.message = this.messaggio || 'Accesso non autorizzato.';
    }
  }

  /**
   * Mappa l'eventuale messaggio di errore del backend a un messaggio utente fisso.
   */
  private getMessageForError(backendMessage: string | undefined): string {
    if (!backendMessage || !backendMessage.trim()) {
      return 'Accesso non autorizzato.';
    }
    const msg = backendMessage.toLowerCase();
    if (msg.includes('nessuna prenotazione') || msg.includes('prenotazione trovata')) {
      return 'Nessuna prenotazione trovata.';
    }
    if (msg.includes('annullata')) {
      return 'Prenotazione annullata.';
    }
    if (msg.includes('scaduta')) {
      return 'Prenotazione scaduta.';
    }
    if (msg.includes('troppo presto')) {
      return 'Troppo presto. Accesso consentito solo 15 minuti prima dell\'orario di inizio.';
    }
    if (msg.includes('uuid non valido') || msg.includes('uuid non può') || msg.includes('codice')) {
      return 'Codice non valido.';
    }
    if (msg.includes('Shelly non pronto') || msg.includes('shelly')) {
      return 'Impossibile aprire la porta: dispositivo Shelly non pronto.';
    }
    if (msg.includes('Orario della prenotazione scaduto') || msg.includes('orario') || msg.includes('scaduto')){
      return 'Orario della prenotazione scaduto: il tempo prenotato è terminato.';
    }
    return 'Accesso non autorizzato.';
  }

}
