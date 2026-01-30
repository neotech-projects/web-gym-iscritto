import { Component, OnInit } from '@angular/core';
import { PrenotazioneService, Prenotazione } from '../../services/prenotazione.service';

@Component({
  selector: 'app-le-mie-prenotazioni',
  templateUrl: './le-mie-prenotazioni.component.html',
  styleUrls: ['./le-mie-prenotazioni.component.css']
})
export class LeMiePrenotazioniComponent implements OnInit {
  bookings: Prenotazione[] = [];
  filteredBookings: Prenotazione[] = [];
  currentFilter: 'all' | 'future' | 'past' = 'all';
  openAccordions: { [key: string]: boolean } = {};
  
  colorClasses = ['primary', 'info', 'success', 'warning', 'danger', 'secondary'];

  constructor(private prenotazioneService: PrenotazioneService) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    // Carica lo storico completo delle prenotazioni (future e passate) dal microservizio
    this.prenotazioneService.getStoricoPrenotazioni().subscribe(bookings => {
      this.bookings = bookings;
      this.filterBookings(this.currentFilter);
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

  calculateDuration(startTime: string, endTime: string): string {
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
    
    const message = `Sei sicuro di voler cancellare la prenotazione?\n\nData: ${this.formatDate(booking.data)}\nOrario: ${booking.oraInizio} - ${booking.oraFine}`;
    
    if (confirm(message)) {
      this.prenotazioneService.annullaPrenotazione(id).subscribe(success => {
        if (success) {
          this.bookings = this.bookings.filter(b => b.id !== id);
          this.filterBookings(this.currentFilter);
          alert('Prenotazione cancellata con successo!');
        }
      });
    }
  }
}
