import { Component, OnInit } from '@angular/core';
import { PrenotazioneService, Prenotazione } from '../../services/prenotazione.service';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-le-mie-prenotazioni',
  templateUrl: './le-mie-prenotazioni.component.html',
  styleUrls: ['./le-mie-prenotazioni.component.css']
})
export class LeMiePrenotazioniComponent implements OnInit {
  bookings: Prenotazione[] = [];
  filteredBookings: Prenotazione[] = [];
  currentFilter: 'all' | 'future' | 'past' = 'all';
  loading = false;
  openAccordions: { [key: string]: boolean } = {};
  
  colorClasses = ['primary', 'info', 'success', 'warning', 'danger', 'secondary'];

  constructor(
    private prenotazioneService: PrenotazioneService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    const utenteId = this.authService.getCurrentUser()?.id;
    if (utenteId == null) {
      this.bookings = [];
      this.filterBookings(this.currentFilter);
      return;
    }
    this.loading = true;
    this.prenotazioneService.getStoricoPrenotazioni(utenteId).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (bookings) => {
        this.bookings = Array.isArray(bookings) ? bookings : [];
        this.filterBookings(this.currentFilter);
      },
      error: () => {
        this.bookings = [];
        this.filterBookings(this.currentFilter);
      }
    });
  }

  filterBookings(filter: 'all' | 'future' | 'past'): void {
    this.currentFilter = filter;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filter === 'future') {
      this.filteredBookings = this.bookings.filter(b => {
        const bookingDate = new Date(b.data);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate >= today;
      });
    } else if (filter === 'past') {
      this.filteredBookings = this.bookings.filter(b => {
        const bookingDate = new Date(b.data);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate < today;
      });
    } else {
      this.filteredBookings = [...this.bookings];
    }
    
    // Ordina per data decrescente
    this.filteredBookings.sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);
      return dateB.getTime() - dateA.getTime();
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('it-IT', options);
  }

  formatOrario(ora: string | undefined): string {
    if (!ora) return '–';
    const t = (ora + '').trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) return t.substring(0, 5);
    try {
      const d = new Date(t);
      if (!isNaN(d.getTime())) return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch { }
    return t;
  }

  getOrario(booking: Prenotazione): string {
    return booking?.oraInizio ?? (booking as any)?.ora_inizio ?? '';
  }

  getDurata(booking: Prenotazione): string {
    const min = booking?.durataMinuti ?? (booking as any)?.durata_minuti;
    if (min != null) {
      if (min < 60) return `${min} min`;
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return this.calculateDuration(this.getOrario(booking), booking.oraFine ?? (booking as any).ora_fine);
  }

  calculateDuration(startTime: string | undefined, endTime: string | undefined): string {
    if (!startTime || !endTime) return '–';
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes >= 60) {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${durationMinutes}m`;
  }

  isFuture(booking: Prenotazione): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(booking.data);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  }

  getColorClass(index: number): string {
    return this.colorClasses[index % this.colorClasses.length];
  }

  toggleAccordion(id: string): void {
    this.openAccordions[id] = !this.openAccordions[id];
  }

  getAccordionState(id: string): string {
    return this.openAccordions[id] ? 'true' : 'false';
  }

  isAccordionOpen(id: string): boolean {
    return this.openAccordions[id] === true;
  }

  cancelBooking(id: number): void {
    const booking = this.bookings.find(b => b.id === id);
    if (!booking) return;
    
    const message = `Sei sicuro di voler cancellare la prenotazione?\n\nData: ${this.formatDate(booking.data)}\nOrario: ${this.formatOrario(booking.oraInizio ?? (booking as any).ora_inizio ?? '')}`;
    
    if (confirm(message)) {
      this.prenotazioneService.annullaPrenotazione(id).subscribe({
        next: () => {
          this.bookings = this.bookings.filter(b => b.id !== id);
          this.filterBookings(this.currentFilter);
          alert('Prenotazione cancellata con successo!');
        },
        error: () => alert('Errore durante la cancellazione della prenotazione.')
      });
    }
  }
}
