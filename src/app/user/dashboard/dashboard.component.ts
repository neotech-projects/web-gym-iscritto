import { Component, OnInit } from '@angular/core';
import { PrenotazioneService } from '../../services/prenotazione.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  bookingsCount: number = 0;
  workoutsCount: number = 0;
  prossimePrenotazioni: any[] = [];
  loading: boolean = false;
  openAccordions: Set<string> = new Set();

  constructor(
    private prenotazioneService: PrenotazioneService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadProssimePrenotazioni();
  }

  toggleAccordion(id: string): void {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (!element) return;

      if (this.openAccordions.has(id)) {
        // Chiudi
        element.classList.remove('show');
        this.openAccordions.delete(id);
      } else {
        // Chiudi tutti gli altri
        this.openAccordions.forEach(openId => {
          const openElement = document.getElementById(openId);
          if (openElement) {
            openElement.classList.remove('show');
          }
        });
        this.openAccordions.clear();
        
        // Apri questo
        element.classList.add('show');
        this.openAccordions.add(id);
      }
    }, 10);
  }

  getAccordionState(id: string): string {
    return this.openAccordions.has(id) ? 'true' : 'false';
  }

  loadStats(): void {
    const utenteId = this.authService.getCurrentUser()?.id;
    if (utenteId == null) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.prenotazioneService.getStatistiche(utenteId).subscribe({
      next: (stats) => {
        if (stats) {
          this.bookingsCount = stats.prenotazioni || 0;
          this.workoutsCount = stats.allenamenti || 0;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore caricamento statistiche:', err);
        // Valori di default in caso di errore
        this.bookingsCount = 0;
        this.workoutsCount = 0;
        this.loading = false;
      }
    });
  }

  loadProssimePrenotazioni(): void {
    const utenteId = this.authService.getCurrentUser()?.id;
    if (utenteId == null) {
      this.prossimePrenotazioni = [];
      return;
    }
    this.prenotazioneService.getProssimePrenotazioni(utenteId).subscribe({
      next: (prenotazioni) => {
        if (prenotazioni && Array.isArray(prenotazioni)) {
          this.prossimePrenotazioni = prenotazioni;
        } else {
          this.prossimePrenotazioni = [];
        }
      },
      error: (err) => {
        console.error('Errore caricamento prenotazioni:', err);
        // Array vuoto in caso di errore
        this.prossimePrenotazioni = [];
      }
    });
  }

  annullaPrenotazione(id: number): void {
    if (confirm('Sei sicuro di voler annullare questa prenotazione?')) {
      this.prenotazioneService.annullaPrenotazione(id).subscribe({
        next: () => {
          this.loadProssimePrenotazioni();
          this.loadStats();
        },
        error: (err) => {
          console.error('Errore annullamento prenotazione:', err);
        }
      });
    }
  }

  formatData(data: string): string {
    if (!data) return '';
    
    try {
      const date = new Date(data);
      if (isNaN(date.getTime())) return data; // Se la data non è valida, ritorna il valore originale
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);
      const dayAfter2 = new Date(today);
      dayAfter2.setDate(dayAfter2.getDate() + 3);

      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);

      if (dateOnly.getTime() === tomorrow.getTime()) {
        return 'Domani';
      } else if (dateOnly.getTime() === dayAfter.getTime()) {
        return 'Tra 2 giorni';
      } else if (dateOnly.getTime() === dayAfter2.getTime()) {
        return 'Tra 3 giorni';
      } else {
        return date.toLocaleDateString('it-IT');
      }
    } catch (error) {
      console.error('Errore formattazione data:', error);
      return data;
    }
  }

  formatOrario(oraInizio: string): string {
    if (!oraInizio) return '–';
    const t = (oraInizio + '').trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) return t.substring(0, 5);
    try {
      const d = new Date(t);
      if (!isNaN(d.getTime())) {
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
      }
    } catch { }
    return t;
  }

  getOrario(prenotazione: any): string {
    return prenotazione?.oraInizio ?? (prenotazione as any)?.ora_inizio ?? '';
  }

  getDurata(prenotazione: any): string {
    const min = prenotazione?.durataMinuti ?? (prenotazione as any)?.durata_minuti;
    if (min == null) return '–';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
}

