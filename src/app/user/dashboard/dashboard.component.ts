import { Component, OnInit, AfterViewInit } from '@angular/core';
import { PrenotazioneService } from '../../services/prenotazione.service';
import { AuthService } from '../../services/auth.service';

declare var bootstrap: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
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

  ngAfterViewInit(): void {
    // Nessuna inizializzazione necessaria - gestiamo gli accordion manualmente
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
    this.loading = true;
    this.prenotazioneService.getStatistiche().subscribe({
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
    this.prenotazioneService.getProssimePrenotazioni().subscribe({
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

  getBadgeClass(index: number): string {
    const classes = [
      'bg-primary-subtle text-primary',
      'bg-info-subtle text-info',
      'bg-success-subtle text-success',
      'bg-warning-subtle text-warning',
      'bg-danger-subtle text-danger',
      'bg-secondary-subtle text-secondary'
    ];
    return classes[index % classes.length];
  }
}

