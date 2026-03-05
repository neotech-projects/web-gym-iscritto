import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PrenotazioneService } from '../../services/prenotazione.service';

@Component({
  selector: 'app-accesso-porta',
  templateUrl: './accesso-porta.component.html',
  styleUrls: ['./accesso-porta.component.css']
})
export class AccessoPortaComponent implements OnInit {
  @ViewChild('checkForm') checkFormRef!: ElementRef<HTMLFormElement>;

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

  /** URL per il form POST (check-prenotazione); impostato quando abbiamo uuid + utenteId */
  checkFormAction: string = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private prenotazioneService: PrenotazioneService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const uuid = params['uuid'] ?? params['UUID'] ?? null;
      const esitoParam = params['esito'];
      const messaggioParam = params['messaggio'] ?? '';

      // Arrivo dalla redirect del backend: mostra esito e messaggio
      if (esitoParam === 'ok' || esitoParam === 'ko') {
        this.state = 'result';
        this.esito = esitoParam;
        this.messaggio = decodeURIComponent(messaggioParam || '');
        this.applyResultView();
        return;
      }

      // Arrivo con solo uuid (scansione QR): avvia verifica
      if (uuid) {
        const utenteId = this.authService.getCurrentUser()?.id ?? null;
        if (utenteId == null) {
          this.state = 'no-user';
          this.message = 'Effettua il login per verificare l\'accesso.';
          this.badgeClass = 'badge-warning';
          this.badgeText = 'ACCESSO NEGATO';
          this.imagePath = 'assets/images/portachiusa.png';
          return;
        }
        this.state = 'loading';
        this.checkFormAction = this.prenotazioneService.getCheckPrenotazioneUrl(uuid, utenteId);
        // Submit del form alla prossima tick così il template ha il form con [action] aggiornato
        setTimeout(() => this.submitCheckForm(), 0);
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

  private submitCheckForm(): void {
    const form = this.checkFormRef?.nativeElement;
    if (form && this.checkFormAction) {
      form.submit();
    }
  }
}
