import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-accesso-porta',
  templateUrl: './accesso-porta.component.html',
  styleUrls: ['./accesso-porta.component.css']
})
export class AccessoPortaComponent implements OnInit {
  scenario: number = 0;
  badgeClass: string = 'badge-success';
  badgeText: string = 'PORTA APERTA';
  imagePath: string = 'assets/images/portaaperta.png';
  message: string = 'Accesso autorizzato. Benvenuto in palestra!';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Controlla se c'è un parametro QR code nella route (per future implementazioni)
    // Per ora simula le diverse casistiche in modo random
    this.checkAccess();
  }

  checkAccess(): void {
    // Genera un numero random tra 0 e 3 per simulare diverse casistiche
    // 0 = Accesso consentito (utente registrato + prenotazione valida)
    // 1 = Utente non registrato
    // 2 = Prenotazione non presente
    // 3 = Troppo presto (prenotazione tra 20 minuti)
    this.scenario = Math.floor(Math.random() * 4);
    
    switch(this.scenario) {
      case 0:
        // Accesso consentito
        this.badgeClass = 'badge-success';
        this.badgeText = 'PORTA APERTA';
        this.imagePath = 'assets/images/portaaperta.png';
        this.message = 'Accesso abilitato. Benvenuto in palestra!';
        break;
        
      case 1:
        // Utente non registrato
        this.badgeClass = 'badge-warning';
        this.badgeText = 'PORTA CHIUSA';
        this.imagePath = 'assets/images/portachiusa.png';
        this.message = 'Utente non abilitato. Contatta la reception per maggiori informazioni.';
        break;
        
      case 2:
        // Prenotazione non presente
        this.badgeClass = 'badge-warning';
        this.badgeText = 'PORTA CHIUSA';
        this.imagePath = 'assets/images/portachiusa.png';
        this.message = 'Nessuna prenotazione trovata per questo orario. Verifica la tua prenotazione.';
        break;
        
      case 3:
        // Troppo presto (prenotazione tra 20 minuti)
        this.badgeClass = 'badge-warning';
        this.badgeText = 'PORTA CHIUSA';
        this.imagePath = 'assets/images/portachiusa.png';
        this.message = 'La tua prenotazione è tra 20 minuti. Accedi al momento giusto.';
        break;
    }
  }
}
