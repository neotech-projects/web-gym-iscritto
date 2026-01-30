import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrenotazioneService, PrenotazioneGenerale } from '../../services/prenotazione.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-prenota',
  templateUrl: './prenota.component.html',
  styleUrls: ['./prenota.component.css']
})
export class PrenotaComponent implements OnInit, AfterViewInit, OnDestroy {
  bookingForm!: FormGroup;
  calendar: any;
  
  private allBookings: any[] = [];
  private myBookings: any[] = [];
  private currentViewingEvent: any = null;
  private readonly MAX_CAPACITY = 10;

  constructor(
    private fb: FormBuilder,
    private prenotazioneService: PrenotazioneService,
    private authService: AuthService
  ) {
    this.bookingForm = this.fb.group({
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Esponi selectTimeSlot globalmente per il template
    (window as any).selectTimeSlot = (startISO: string, endISO: string) => {
      this.selectTimeSlot(new Date(startISO), new Date(endISO));
    };
  }

  ngAfterViewInit(): void {
    // Carica le prenotazioni prima di inizializzare il calendario
    // Il calendario verrà inizializzato in loadBookings() dopo che i dati sono pronti
    this.loadBookings();
    
    // Verifica che FullCalendar sia disponibile
    this.waitForFullCalendar();
  }

  private waitForFullCalendar(): void {
    // Funzione rimossa - non necessaria
  }

  private initializeCalendarWithRetry(attempt: number = 0): void {
    const maxAttempts = 5; // Ridotto da 10 a 5 per essere più veloce
    
    if (typeof (window as any).FullCalendar !== 'undefined') {
      this.initCalendar();
      this.setupFormValidation();
      this.setupModalCleanup();
    } else {
      attempt++;
      if (attempt < maxAttempts) {
        setTimeout(() => this.initializeCalendarWithRetry(attempt), 150);
      } else {
        // Usa fallback manuale invece di alert
        this.initCalendar();
        this.setupFormValidation();
        this.setupModalCleanup();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.calendar) {
      this.calendar.destroy();
    }
  }

  private loadBookings(): void {
    const user = this.authService.getCurrentUser();
    const userName = user ? `${user.nome} ${user.cognome}` : 'Mario Rossi';

    // Carica le prenotazioni dell'utente corrente
    this.prenotazioneService.getPrenotazioni().subscribe(bookings => {
      // Converti le prenotazioni nel formato per FullCalendar
      this.myBookings = bookings.map(booking => {
        const start = new Date(`${booking.data}T${booking.oraInizio}`);
        const end = new Date(`${booking.data}T${booking.oraFine}`);
        
        return {
          id: String(booking.id),
          title: 'La mia prenotazione',
          start: start.toISOString(),
          end: end.toISOString(),
          backgroundColor: '#405189',
          borderColor: '#405189',
          extendedProps: {
            user: userName,
            isMyBooking: true
          }
        };
      });
    });

    // Carica tutte le prenotazioni generali (di tutti gli utenti) per calcolare disponibilità
    this.prenotazioneService.getPrenotazioniGenerali().subscribe(prenotazioniGenerali => {
      // Converti le prenotazioni generali nel formato atteso
      this.allBookings = prenotazioniGenerali.map(prenotazione => {
        const start = new Date(`${prenotazione.data}T${prenotazione.oraInizio}`);
        const end = new Date(`${prenotazione.data}T${prenotazione.oraFine}`);
        
        return {
          id: String(prenotazione.id),
          user: prenotazione.utente,
          start: start.toISOString(),
          end: end.toISOString()
        };
      });

      // Aggiungi anche le prenotazioni dell'utente corrente se non sono già presenti
      const userBookings = this.myBookings.map(b => ({
        id: b.id,
        user: b.extendedProps.user || userName,
        start: b.start,
        end: b.end
      }));

      // Unisci le prenotazioni, evitando duplicati
      const existingIds = new Set(this.allBookings.map(b => b.id));
      userBookings.forEach(ub => {
        if (!existingIds.has(ub.id)) {
          this.allBookings.push(ub);
        }
      });
      
      // Se il calendario è già inizializzato, aggiornalo
      if (this.calendar) {
        this.updateCalendar();
      } else {
        // Altrimenti inizializzalo ora dopo che i dati sono pronti
        this.initializeCalendarWithRetry();
      }
    });
  }

  // Metodo rimosso - ora le prenotazioni generali arrivano dal microservizio

  private initCalendar(): void {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
      return;
    }
    
    if (typeof (window as any).FullCalendar === 'undefined') {
      // Retry dopo un po'
      setTimeout(() => {
        if (typeof (window as any).FullCalendar !== 'undefined') {
          this.initCalendar();
        }
      }, 500);
      return;
    }
    
    const FullCalendar = (window as any).FullCalendar;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];
    
    // Imposta data minima
    const dateInput = document.getElementById('bookingDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.setAttribute('min', todayISO);
    }

    const allEvents = [...this.myBookings, ...this.generateAvailabilityBackgrounds()];

    this.calendar = new FullCalendar.Calendar(calendarEl, {
      locale: 'it',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      initialView: 'dayGridMonth',
      slotMinTime: '06:00:00',
      slotMaxTime: '23:00:00',
      slotDuration: '00:30:00',
      allDaySlot: false,
      editable: false,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true, // Mostra tutti gli eventi, ma li nascondiamo con CSS per mostrare solo il primo
      weekends: true,
      businessHours: {
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        startTime: '06:00',
        endTime: '23:00'
      },
      events: allEvents,
      dateClick: (info: any) => {
        this.handleDateClick(info);
      },
      select: (info: any) => {
        this.handleSelect(info);
      },
      eventClick: (info: any) => {
        this.handleEventClick(info);
      },
      eventMouseEnter: (info: any) => {
        if (info.event.extendedProps.isMyBooking === true) {
          info.el.style.cursor = 'pointer';
        }
      },
      eventDidMount: (info: any) => {
        if (info.event.display === 'background' && info.event.title) {
          info.el.title = info.event.title;
        }
      },
      dayCellDidMount: (info: any) => {
        if (this.calendar.view.type === 'dayGridMonth') {
          this.colorDayCell(info);
        }
        // Personalizza i link "+X more" dopo il rendering
        this.customizeMoreLinks(info.el);
        // Nascondi il link "+X more" se c'è solo un evento visibile
        this.hideMoreLinkIfSingleEvent(info.el);
        // Su mobile, forza il posizionamento corretto degli eventi
        if (this.isMobile()) {
          this.fixMobileEventPositioning(info.el);
        }
      },
      moreLinkText: (num: number) => {
        // Personalizza il testo del "+X more"
        return `${num} prenotazion${num === 1 ? 'e' : 'i'}`;
      },
      moreLinkClick: (info: any, element: HTMLElement) => {
        // In modalità mobile, apri direttamente il riepilogo e previeni il popover
        if (this.isMobile()) {
          // Previeni completamente il popover
          const result = this.handleMoreLinkClickMobile(info);
          if (result) {
            // Nascondi immediatamente qualsiasi popover esistente
            setTimeout(() => {
              const popovers = document.querySelectorAll('.fc-popover');
              popovers.forEach((popover: any) => {
                popover.style.display = 'none';
                popover.remove();
              });
            }, 0);
            // Previeni il comportamento predefinito (popover)
            return false;
          }
        }
        // Su desktop o se non abbiamo trovato prenotazioni, usa il comportamento predefinito
        return undefined;
      }
    });

    this.calendar.render();
    
    // In mobile, monitora e rimuovi immediatamente qualsiasi popover creato
    if (this.isMobile()) {
      this.setupPopoverRemoval();
    }
    
    // Personalizza i link "+X more" dopo il rendering iniziale
    setTimeout(() => {
      this.customizeAllMoreLinks();
      this.removeDuplicateEvents();
      this.setupDuplicateRemovalObserver();
    }, 100);
    
    // Personalizza anche dopo ogni cambio di vista
    this.calendar.on('eventsSet', () => {
      setTimeout(() => {
        this.customizeAllMoreLinks();
        this.removeDuplicateEvents();
        // Nascondi i link "+X more" quando c'è solo un evento
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
          const allDayCells = calendarEl.querySelectorAll('.fc-day');
          allDayCells.forEach((cell: any) => {
            this.hideMoreLinkIfSingleEvent(cell);
            // Su mobile, forza il posizionamento corretto
            if (this.isMobile()) {
              this.fixMobileEventPositioning(cell);
            }
          });
        }
      }, 50);
    });
    
    // Rimuovi duplicati anche dopo ogni render
    this.calendar.on('eventDidMount', () => {
      setTimeout(() => {
        this.removeDuplicateEvents();
      }, 10);
    });
  }
  
  private setupPopoverRemoval(): void {
    // Observer per rimuovere immediatamente qualsiasi popover creato
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node: any) => {
          if (node.nodeType === 1) { // Element node
            // Controlla se il nodo è un popover o lo contiene
            if (node.classList && node.classList.contains('fc-popover')) {
              node.style.display = 'none';
              node.remove();
            } else if (node.querySelector && node.querySelector('.fc-popover')) {
              const popover = node.querySelector('.fc-popover');
              if (popover) {
                (popover as HTMLElement).style.display = 'none';
                popover.remove();
              }
            }
          }
        });
      });
    });
    
    // Osserva il body per nuovi popover
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private handleDateClick(info: any): void {
    // Controlla se la data è nel passato
    const clickedDate = new Date(info.date);
    clickedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (clickedDate < today) {
      alert('⚠️ Non è possibile prenotare per giorni passati.\n\nSeleziona una data odierna o futura.');
      return;
    }
    
    // Se siamo nella vista mensile, mostra la disponibilità del giorno nella modale
    if (this.calendar.view.type === 'dayGridMonth') {
      this.openBookingModalWithDayView(info.date);
    }
  }

  private handleSelect(info: any): void {
    if (!this.calendar || !this.calendar.view) {
      return;
    }
    
    if (this.calendar.view.type === 'dayGridMonth') {
      this.calendar.unselect();
      return;
    }
    
    const selectedDate = new Date(info.start);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('⚠️ Non è possibile prenotare per giorni passati.');
      this.calendar.unselect();
      return;
    }
    
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      if (info.start < now) {
        alert('⚠️ Non è possibile prenotare per orari passati.');
        this.calendar.unselect();
        return;
      }
    }
    
    // Solo nella vista settimanale/giornaliera controlla se è pieno
    if (this.calendar.view.type !== 'dayGridMonth') {
      // Controlla se l'utente ha già una prenotazione in questo orario
      if (this.hasUserBookingInSlot(info.start, info.end)) {
        alert('⚠️ Hai già una prenotazione personale in questo orario.\n\nNon puoi prenotare nuovamente lo stesso slot temporale.');
        this.calendar.unselect();
        return;
      }
      
      // Controlla la disponibilità per l'intero periodo selezionato
      const maxCount = this.checkAvailabilityForPeriod(info.start, info.end);
      
      if (maxCount >= this.MAX_CAPACITY) {
        alert('⚠️ Spiacenti, la palestra è al completo per questo orario.\n\nCapacità massima: 10 persone\nPrenotazioni attuali: ' + maxCount + '\n\nProva a selezionare un altro orario.');
        this.calendar.unselect();
        return;
      }
      
      this.openBookingModal(info.start, info.end, maxCount);
    }
  }

  private handleEventClick(info: any): void {
    // Solo le prenotazioni dell'utente sono cliccabili
    if (info.event.extendedProps.isMyBooking === true) {
      this.showBookingDetails(info.event);
    }
  }

  private generateAvailabilityBackgrounds(): any[] {
    const backgrounds: any[] = [];
    const today = new Date();
    
    for (let day = 0; day < 14; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      for (let hour = 6; hour < 23; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
          const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
          
          const count = this.countBookingsInSlot(slotStart, slotEnd);
          
          let bgColor: string, title: string;
          
          if (count >= this.MAX_CAPACITY) {
            bgColor = '#f06548';
            title = `Occupato (${count}/${this.MAX_CAPACITY})`;
          } else if (count > 0) {
            bgColor = '#f7b84b';
            title = `Parzialmente occupato (${count}/${this.MAX_CAPACITY})`;
          } else {
            bgColor = 'rgba(10, 179, 156, 0.15)';
            title = 'Disponibile';
          }
          
          backgrounds.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            display: 'background',
            backgroundColor: bgColor,
            title: title
          });
        }
      }
    }
    
    return backgrounds;
  }

  private countBookingsInSlot(slotStart: Date, slotEnd: Date): number {
    let count = 0;
    
    // Conta le prenotazioni in allBookings
    this.allBookings.forEach(booking => {
      const bookingStart = new Date(booking.start);
      const bookingEnd = new Date(booking.end);
      
      if (bookingStart < slotEnd && bookingEnd > slotStart) {
        count++;
      }
    });
    
    // Aggiungi anche le prenotazioni dell'utente da myBookings se non sono già in allBookings
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const userName = currentUser.nome + ' ' + currentUser.cognome;
      this.myBookings.forEach(booking => {
        const bookingStart = new Date(booking.start);
        const bookingEnd = new Date(booking.end);
        
        if (bookingStart < slotEnd && bookingEnd > slotStart) {
          // Controlla se questa prenotazione è già stata contata in allBookings
          const alreadyCounted = this.allBookings.some(ab => {
            const abStart = new Date(ab.start);
            const abEnd = new Date(ab.end);
            return abStart.getTime() === bookingStart.getTime() && 
                   abEnd.getTime() === bookingEnd.getTime() &&
                   ab.user === userName;
          });
          
          if (!alreadyCounted) {
            count++;
          }
        }
      });
    }
    
    return count;
  }

  private hasUserBookingInSlot(slotStart: Date, slotEnd: Date): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    const userName = currentUser.nome + ' ' + currentUser.cognome;
    const now = new Date();
    
    // Controlla prima in myBookings (più affidabile per le prenotazioni dell'utente)
    // Solo prenotazioni future (non scadute)
    const hasInMyBookings = this.myBookings.some(booking => {
      const bookingStart = new Date(booking.start);
      const bookingEnd = new Date(booking.end);
      // Controlla sovrapposizione E che la prenotazione sia ancora futura
      return bookingEnd > now && bookingStart < slotEnd && bookingEnd > slotStart;
    });
    
    if (hasInMyBookings) return true;
    
    // Se non trovata in myBookings, controlla in allBookings
    // Solo prenotazioni future (non scadute)
    return this.allBookings.some(booking => {
      if (booking.user !== userName) return false;
      
      const bookingStart = new Date(booking.start);
      const bookingEnd = new Date(booking.end);
      
      // Controlla sovrapposizione E che la prenotazione sia ancora futura
      return bookingEnd > now && bookingStart < slotEnd && bookingEnd > slotStart;
    });
  }
  
  private hasActiveFutureBooking(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    const userName = currentUser.nome + ' ' + currentUser.cognome;
    const now = new Date();
    
    // Controlla se l'utente ha già una prenotazione futura attiva
    const hasFutureInMyBookings = this.myBookings.some(booking => {
      const bookingEnd = new Date(booking.end);
      return bookingEnd > now;
    });
    
    if (hasFutureInMyBookings) return true;
    
    // Controlla anche in allBookings
    return this.allBookings.some(booking => {
      if (booking.user !== userName) return false;
      const bookingEnd = new Date(booking.end);
      return bookingEnd > now;
    });
  }

  private checkAvailabilityForPeriod(start: Date, end: Date): number {
    let maxCount = 0;
    let currentSlot = new Date(start);
    
    while (currentSlot < end) {
      const slotEnd = new Date(currentSlot.getTime() + 30 * 60000);
      const count = this.countBookingsInSlot(currentSlot, slotEnd);
      if (count > maxCount) maxCount = count;
      currentSlot = slotEnd;
    }
    
    return maxCount;
  }

  private colorDayCell(info: any): void {
    if (this.calendar.view.type !== 'dayGridMonth') return;
    
    let maxOccupancy = 0;
    let hasAvailability = false;
    
    for (let hour = 6; hour < 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(info.date);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
        
        const count = this.countBookingsInSlot(slotStart, slotEnd);
        if (count > maxOccupancy) maxOccupancy = count;
        if (count < this.MAX_CAPACITY) hasAvailability = true;
      }
    }
    
    if (maxOccupancy >= this.MAX_CAPACITY && !hasAvailability) {
      (info.el as HTMLElement).style.backgroundColor = 'rgba(240, 101, 72, 0.2)';
    } else if (maxOccupancy > 0) {
      (info.el as HTMLElement).style.backgroundColor = 'rgba(247, 184, 75, 0.15)';
    } else {
      (info.el as HTMLElement).style.backgroundColor = 'rgba(10, 179, 156, 0.1)';
    }
  }

  private openBookingModal(start: Date, end: Date, currentOccupancy: number = 0): void {
    const daySection = document.getElementById('dayAvailabilitySection');
    if (daySection) daySection.style.display = 'none';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];
    
    const dateInput = document.getElementById('bookingDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.setAttribute('min', todayISO);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      dateInput.value = `${year}-${month}-${day}`;
    }
    
    const startTimeInput = document.getElementById('bookingStartTime') as HTMLInputElement;
    if (startTimeInput) {
      const startHours = String(startDate.getHours()).padStart(2, '0');
      const startMinutes = String(startDate.getMinutes()).padStart(2, '0');
      startTimeInput.value = `${startHours}:${startMinutes}`;
      this.bookingForm.patchValue({ startTime: `${startHours}:${startMinutes}` });
    }
    
    const endTimeInput = document.getElementById('bookingEndTime') as HTMLInputElement;
    if (endTimeInput) {
      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
      endTimeInput.value = `${endHours}:${endMinutes}`;
      this.bookingForm.patchValue({ endTime: `${endHours}:${endMinutes}` });
    }
    
    this.updateAvailabilityInfo(currentOccupancy);
    
    this.showModal('bookingModal');
  }

  private showModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;
    
    // Blocca lo scroll del body quando la modale si apre
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0'; // Previene il jump quando appare la scrollbar
    
    // Prova subito con Bootstrap, se non disponibile usa fallback immediato
    const Bootstrap = (window as any).bootstrap;
    if (Bootstrap && Bootstrap.Modal) {
      try {
        let modal = Bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
          modal = new Bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
          });
        }
        modal.show();
        
        // Aggiungi listener manuali immediatamente per i pulsanti di chiusura
        this.attachCloseListeners(modalElement, modalId);
        
        // Listener per quando la modale viene chiusa - ripristina scroll
        modalElement.addEventListener('hidden.bs.modal', () => {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }, { once: true });
      } catch (error) {
        this.openModalManually(modalElement);
      }
    } else {
      // Fallback immediato senza attesa
      this.openModalManually(modalElement);
    }
  }

  private attachCloseListeners(modalElement: HTMLElement, modalId: string): void {
    const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
    closeButtons.forEach(btn => {
      // Rimuovi listener esistenti per evitare duplicati
      const newBtn = btn.cloneNode(true) as HTMLElement;
      btn.parentNode?.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeModal(modalId);
      });
    });
  }

  private openModalManually(modalElement: HTMLElement): void {
    // Rimuovi eventuali backdrop esistenti
    const existingBackdrops = document.querySelectorAll('.modal-backdrop');
    existingBackdrops.forEach(backdrop => backdrop.remove());
    
    // Apri la modale manualmente
    modalElement.classList.add('show');
    modalElement.style.display = 'block';
    modalElement.removeAttribute('aria-hidden');
    modalElement.setAttribute('aria-modal', 'true');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    // Crea backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.style.zIndex = '1040';
    document.body.appendChild(backdrop);
    
    // Aggiungi listener per chiudere cliccando sul backdrop
    backdrop.addEventListener('click', () => {
      this.closeModalManually(modalElement);
    });
    
    // Aggiungi listener per i pulsanti di chiusura
    const modalId = modalElement.id;
    this.attachCloseListeners(modalElement, modalId);
    
    // Aggiungi listener per chiudere con ESC
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalElement.classList.contains('show')) {
        this.closeModalManually(modalElement);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  private closeModalManually(modalElement: HTMLElement): void {
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.removeAttribute('aria-modal');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    
    // Rimuovi backdrop
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Rimuovi il focus dagli elementi interni per evitare l'errore aria-hidden
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement && modalElement.contains(focusedElement)) {
      focusedElement.blur();
    }
  }

  private openBookingModalWithDayView(date: Date): void {
    const daySection = document.getElementById('dayAvailabilitySection');
    if (daySection) daySection.style.display = 'block';
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = date.toLocaleDateString('it-IT', options);
    const titleElement = document.getElementById('selectedDayTitle');
    if (titleElement) titleElement.textContent = dateStr;
    
    const tableBody = document.getElementById('dayAvailabilityTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      
      const now = new Date();
      const clickedDate = new Date(date);
      clickedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = clickedDate.getTime() === today.getTime();
      
      // Conta quante prenotazioni personali l'utente ha in questo giorno
      const userBookingsForDay: any[] = [];
      this.myBookings.forEach(booking => {
        const bookingDate = new Date(booking.start);
        bookingDate.setHours(0, 0, 0, 0);
        if (bookingDate.getTime() === clickedDate.getTime()) {
          userBookingsForDay.push(booking);
        }
      });
      
      // Se ci sono più di 1 prenotazione personale, considera solo la prima come personale
      // Le altre verranno mostrate come prenotazioni di altri utenti
      const firstUserBooking = userBookingsForDay.length > 0 ? userBookingsForDay[0] : null;
      const firstUserBookingStart = firstUserBooking ? new Date(firstUserBooking.start) : null;
      const firstUserBookingEnd = firstUserBooking ? new Date(firstUserBooking.end) : null;
      
      for (let hour = 6; hour < 23; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60000);
        
        const count = this.countBookingsInSlot(slotStart, slotEnd);
        const isPastTime = isToday && slotStart < now;
        
        // Controlla se questo slot corrisponde alla PRIMA prenotazione personale
        // Solo quella verrà mostrata come "Già prenotato"
        let isFirstUserBooking = false;
        if (firstUserBookingStart && firstUserBookingEnd) {
          isFirstUserBooking = firstUserBookingStart < slotEnd && firstUserBookingEnd > slotStart;
        }
        
        // Mostra se c'è almeno una prenotazione OPPURE se è la prima prenotazione personale
        if (count > 0 || isFirstUserBooking) {
          // Se è la prima prenotazione personale ma count è 0, assicurati che il conteggio sia almeno 1
          const displayCount = isFirstUserBooking && count === 0 ? 1 : count;
          
          let badgeColor: string, statusText: string, actionButton: string;
          
          if (isPastTime) {
            badgeColor = '#6c757d';
            statusText = this.isMobile() ? 'Passato' : 'Orario Passato';
            const buttonText = this.isMobile() ? 'Non disp.' : 'Non disponibile';
            actionButton = `<button class="btn btn-sm btn-secondary" disabled>${buttonText}</button>`;
          } else if (displayCount >= this.MAX_CAPACITY) {
            badgeColor = '#f06548';
            statusText = 'Occupato';
            const buttonText = this.isMobile() ? 'Non disp.' : 'Non disponibile';
            actionButton = `<button class="btn btn-sm btn-secondary" disabled>${buttonText}</button>`;
          } else if (isFirstUserBooking) {
            // Solo la prima prenotazione personale mostra "Già prenotato"
            badgeColor = '#f7b84b';
            statusText = 'Parzialmente Occupato';
            const buttonText = this.isMobile() ? 'Già prenotato' : 'Hai già una prenotazione';
            actionButton = `<button class="btn btn-sm btn-secondary" disabled>${buttonText}</button>`;
          } else {
            // Le altre prenotazioni personali vengono mostrate come disponibili per prenotare
            badgeColor = '#f7b84b';
            statusText = 'Parzialmente Occupato';
            actionButton = `<button class="btn btn-sm btn-success" onclick="window.selectTimeSlot('${slotStart.toISOString()}', '${slotEnd.toISOString()}')">Prenota</button>`;
          }
          
          const timeStr = `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`;
          
          const row = `
            <tr>
              <td class="fw-semibold">${timeStr}</td>
              <td>
                <div class="d-flex align-items-center">
                  <span class="me-2" style="width: 15px; height: 15px; background-color: ${badgeColor}; display: inline-block; border-radius: 3px;"></span>
                  <span>${displayCount}/${this.MAX_CAPACITY} ${this.isMobile() ? 'occ.' : 'occupato'}</span>
                </div>
              </td>
              <td><span style="color: ${badgeColor}; font-weight: 500;">${statusText}</span></td>
              <td>${actionButton}</td>
            </tr>
          `;
          
          tableBody.innerHTML += row;
        }
      }
      
      if (tableBody.innerHTML === '') {
        tableBody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-muted py-3">
              <i class="ri-calendar-check-line fs-20 d-block mb-2"></i>
              Tutti gli orari sono completamente liberi!
            </td>
          </tr>
        `;
      }
    }
    
    const todayForMin = new Date();
    todayForMin.setHours(0, 0, 0, 0);
    const todayISO = todayForMin.toISOString().split('T')[0];
    
    const dateInput = document.getElementById('bookingDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.setAttribute('min', todayISO);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateInput.value = `${year}-${month}-${day}`;
      this.bookingForm.patchValue({ date: `${year}-${month}-${day}` });
    }
    
    const startTimeInput = document.getElementById('bookingStartTime') as HTMLInputElement;
    const endTimeInput = document.getElementById('bookingEndTime') as HTMLInputElement;
    if (startTimeInput) {
      startTimeInput.value = '';
      this.bookingForm.patchValue({ startTime: '' });
    }
    if (endTimeInput) {
      endTimeInput.value = '';
      this.bookingForm.patchValue({ endTime: '' });
    }
    
    const availabilityInfo = document.getElementById('availabilityInfo');
    if (availabilityInfo) availabilityInfo.style.display = 'none';
    
    this.showModal('bookingModal');
  }

  selectTimeSlot(start: Date, end: Date): void {
    const selectedDate = new Date(start);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('⚠️ Non è possibile prenotare per giorni passati.\n\nSeleziona una data odierna o futura.');
      return;
    }
    
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      if (start < now) {
        alert('⚠️ Non è possibile prenotare per orari passati.\n\nSeleziona un orario futuro.');
        return;
      }
    }
    
    if (this.hasUserBookingInSlot(start, end)) {
      alert('⚠️ Hai già una prenotazione personale in questo orario.\n\nNon puoi prenotare nuovamente lo stesso slot temporale.');
      return;
    }
    
    const startTimeInput = document.getElementById('bookingStartTime') as HTMLInputElement;
    const endTimeInput = document.getElementById('bookingEndTime') as HTMLInputElement;
    
    if (startTimeInput) {
      const startHours = String(start.getHours()).padStart(2, '0');
      const startMinutes = String(start.getMinutes()).padStart(2, '0');
      startTimeInput.value = `${startHours}:${startMinutes}`;
      this.bookingForm.patchValue({ startTime: `${startHours}:${startMinutes}` });
    }
    
    if (endTimeInput) {
      const endHours = String(end.getHours()).padStart(2, '0');
      const endMinutes = String(end.getMinutes()).padStart(2, '0');
      endTimeInput.value = `${endHours}:${endMinutes}`;
      this.bookingForm.patchValue({ endTime: `${endHours}:${endMinutes}` });
    }
    
    const currentOccupancy = this.countBookingsInSlot(start, end);
    this.updateAvailabilityInfo(currentOccupancy);
    
    // Scorri il form verso il basso nella modale
    setTimeout(() => {
      const formElement = document.getElementById('bookingForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  private updateAvailabilityInfo(currentOccupancy: number): void {
    const availabilityInfo = document.getElementById('availabilityInfo');
    const availabilityText = document.getElementById('availabilityText');
    
    if (!availabilityInfo || !availabilityText) return;
    
    const spotsLeft = this.MAX_CAPACITY - currentOccupancy;
    
    if (currentOccupancy > 0) {
      availabilityInfo.style.display = 'block';
      if (spotsLeft > 3) {
        availabilityInfo.className = 'alert alert-warning';
        availabilityText.textContent = `${currentOccupancy}/${this.MAX_CAPACITY} persone prenotate - ${spotsLeft} posti disponibili`;
      } else {
        availabilityInfo.className = 'alert alert-danger';
        availabilityText.textContent = `${currentOccupancy}/${this.MAX_CAPACITY} persone prenotate - Solo ${spotsLeft} ${spotsLeft === 1 ? 'posto rimasto' : 'posti rimasti'}!`;
      }
    } else {
      availabilityInfo.style.display = 'block';
      availabilityInfo.className = 'alert alert-success';
      availabilityText.textContent = `Palestra completamente libera - ${this.MAX_CAPACITY} posti disponibili`;
    }
  }

  confirmBooking(): void {
    // Leggi i valori direttamente dagli input HTML per essere sicuri
    const dateInput = document.getElementById('bookingDate') as HTMLInputElement;
    const startTimeInput = document.getElementById('bookingStartTime') as HTMLInputElement;
    const endTimeInput = document.getElementById('bookingEndTime') as HTMLInputElement;
    
    const date = dateInput?.value || this.bookingForm.get('date')?.value || '';
    const startTime = startTimeInput?.value || this.bookingForm.get('startTime')?.value || '';
    const endTime = endTimeInput?.value || this.bookingForm.get('endTime')?.value || '';
    
    if (!date || !startTime || !endTime) {
      alert('Per favore compila tutti i campi!');
      return;
    }
    
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    
    const selectedDate = new Date(start);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('⚠️ Non è possibile prenotare per giorni passati.');
      return;
    }
    
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      if (start < now) {
        alert('⚠️ Non è possibile prenotare per orari passati.');
        return;
      }
    }
    
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    if (durationMinutes < 30) {
      alert('La durata minima della prenotazione è 30 minuti!');
      return;
    }
    
    if (durationMinutes > 120) {
      alert('La durata massima della prenotazione è 2 ore!');
      return;
    }
    
    if (end <= start) {
      alert('L\'orario di fine deve essere successivo all\'orario di inizio!');
      return;
    }
    
    // Controlla se l'utente ha già una prenotazione futura attiva
    if (this.hasActiveFutureBooking()) {
      alert('⚠️ Hai già una prenotazione attiva. Puoi prenotare di nuovo solo dopo che la prenotazione corrente è scaduta.');
      return;
    }
    
    if (this.hasUserBookingInSlot(start, end)) {
      alert('⚠️ Hai già una prenotazione personale in questo orario.');
      return;
    }
    
    const finalCheck = this.checkAvailabilityForPeriod(start, end);
    if (finalCheck >= this.MAX_CAPACITY) {
      alert('⚠️ Spiacenti, la palestra è diventata al completo per questo orario.');
      return;
    }
    
    const newEvent = {
      id: String(Date.now()),
      title: 'La mia prenotazione',
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: '#405189',
      borderColor: '#405189',
      extendedProps: {
        user: this.authService.getCurrentUser()?.nome + ' ' + this.authService.getCurrentUser()?.cognome,
        isMyBooking: true
      }
    };
    
    this.calendar.addEvent(newEvent);
    this.myBookings.push(newEvent);
    this.allBookings.push({
      id: newEvent.id,
      user: newEvent.extendedProps.user,
      start: newEvent.start,
      end: newEvent.end
    });
    
    // Reset form
    this.bookingForm.reset();
    
    // Usa le variabili già dichiarate all'inizio della funzione
    if (dateInput) dateInput.value = '';
    if (startTimeInput) startTimeInput.value = '';
    if (endTimeInput) endTimeInput.value = '';
    
    const availabilityInfo = document.getElementById('availabilityInfo');
    if (availabilityInfo) availabilityInfo.style.display = 'none';
    
    // Chiudi modale
    const modalElement = document.getElementById('bookingModal');
    if (modalElement) {
      const Bootstrap = (window as any).bootstrap;
      if (Bootstrap) {
        const modal = Bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
      }
    }
    
    // Aggiorna calendario
    this.updateCalendar();
    
    alert(`✓ Prenotazione confermata!\n\nData: ${new Date(date).toLocaleDateString('it-IT')}\nOrario: ${startTime} - ${endTime}\n\nRiceverai una email di conferma a breve.`);
  }

  private showBookingDetails(event: any): void {
    this.currentViewingEvent = event;
    
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    
    const viewDateInput = document.getElementById('viewBookingDate') as HTMLInputElement;
    if (viewDateInput) viewDateInput.value = `${year}-${month}-${day}`;
    
    const viewStartTimeInput = document.getElementById('viewBookingStartTime') as HTMLInputElement;
    if (viewStartTimeInput) {
      const startHours = String(startDate.getHours()).padStart(2, '0');
      const startMinutes = String(startDate.getMinutes()).padStart(2, '0');
      viewStartTimeInput.value = `${startHours}:${startMinutes}`;
    }
    
    const viewEndTimeInput = document.getElementById('viewBookingEndTime') as HTMLInputElement;
    if (viewEndTimeInput) {
      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
      viewEndTimeInput.value = `${endHours}:${endMinutes}`;
    }
    
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    let durationText = '';
    if (durationMinutes >= 60) {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      durationText = `${durationMinutes}m`;
    }
    
    const durationElement = document.getElementById('viewDuration');
    if (durationElement) durationElement.textContent = durationText;
    
    this.showModal('viewBookingModal');
  }

  deleteCurrentBooking(): void {
    if (!this.currentViewingEvent) return;
    
    if (confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
      this.currentViewingEvent.remove();
      
      const indexAll = this.allBookings.findIndex(b => b.id === this.currentViewingEvent.id);
      if (indexAll > -1) {
        this.allBookings.splice(indexAll, 1);
      }
      
      const indexMy = this.myBookings.findIndex(b => b.id === this.currentViewingEvent.id);
      if (indexMy > -1) {
        this.myBookings.splice(indexMy, 1);
      }
      
      this.updateCalendar();
      
      const modalElement = document.getElementById('viewBookingModal');
      if (modalElement) {
        const Bootstrap = (window as any).bootstrap;
        const modal = Bootstrap ? Bootstrap.Modal.getInstance(modalElement) : null;
        if (modal) modal.hide();
      }
      
      alert('Prenotazione cancellata con successo!');
      this.currentViewingEvent = null;
    }
  }

  private updateCalendar(): void {
    if (!this.calendar) return;
    
    // Rimuovi tutti gli eventi background
    this.calendar.getEvents().forEach((evt: any) => {
      if (evt.display === 'background') {
        evt.remove();
      }
    });
    
    // IMPORTANTE: Rimuovi eventi duplicati delle prenotazioni
    const allEvents = this.calendar.getEvents();
    const seenIds = new Set<string>();
    allEvents.forEach((evt: any) => {
      if (evt.id && !evt.display) { // Solo eventi normali, non background
        if (seenIds.has(evt.id)) {
          evt.remove(); // Rimuovi duplicati
        } else {
          seenIds.add(evt.id);
        }
      }
    });
    
    // Aggiungi nuovi background
    const newBackgrounds = this.generateAvailabilityBackgrounds();
    newBackgrounds.forEach(bg => this.calendar.addEvent(bg));
    
    // Ricalcola colori e rimuovi duplicati dopo il render
    setTimeout(() => {
      this.calendar.render();
      // Rimuovi duplicati anche dopo il render
      this.removeDuplicateEvents();
      // Nascondi i link "+X more" quando c'è solo un evento
      const calendarEl = document.getElementById('calendar');
      if (calendarEl) {
        const allDayCells = calendarEl.querySelectorAll('.fc-day');
        allDayCells.forEach((cell: any) => {
          this.hideMoreLinkIfSingleEvent(cell);
        });
      }
    }, 100);
  }
  
  private removeDuplicateEvents(): void {
    if (!this.calendar) return;
    
    // Rimuovi duplicati dal DOM direttamente - SOLUZIONE AGGressiva
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
      const dayCells = calendarEl.querySelectorAll('.fc-daygrid-day');
      dayCells.forEach((dayCell: any) => {
        const eventsContainer = dayCell.querySelector('.fc-daygrid-day-events');
        if (eventsContainer) {
          // Trova tutti gli eventi (escludendo il link "+X more")
          const events = Array.from(eventsContainer.querySelectorAll('.fc-daygrid-event:not(.fc-daygrid-more-link)'));
          
          if (events.length > 1) {
            // Mantieni solo il primo evento, rimuovi tutti gli altri dal DOM
            for (let i = 1; i < events.length; i++) {
              const eventEl = events[i] as HTMLElement;
              // Rimuovi completamente dal DOM
              eventEl.remove();
            }
          }
        }
      });
    }
    
    // Rimuovi anche duplicati a livello di eventi FullCalendar
    const allEvents = this.calendar.getEvents();
    const eventsByDay = new Map<string, any[]>();
    
    // Raggruppa eventi per giorno (solo eventi normali, non background)
    allEvents.forEach((evt: any) => {
      if (!evt.display && evt.start) { // Solo eventi normali
        const dayKey = evt.startStr?.split('T')[0] || new Date(evt.start).toISOString().split('T')[0];
        if (!eventsByDay.has(dayKey)) {
          eventsByDay.set(dayKey, []);
        }
        eventsByDay.get(dayKey)!.push(evt);
      }
    });
    
    // Per ogni giorno, mantieni solo il primo evento e rimuovi gli altri
    eventsByDay.forEach((events, dayKey) => {
      if (events.length > 1) {
        // Mantieni il primo, rimuovi gli altri
        for (let i = 1; i < events.length; i++) {
          try {
            events[i].remove();
          } catch (e) {
            // Ignora errori se l'evento è già stato rimosso
          }
        }
      }
    });
    
    // Nascondi i link "+X more" quando c'è solo un evento visibile
    if (calendarEl) {
      const allDayCells = calendarEl.querySelectorAll('.fc-day');
      allDayCells.forEach((cell: any) => {
        this.hideMoreLinkIfSingleEvent(cell);
      });
    }
  }
  
  private setupDuplicateRemovalObserver(): void {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    // Observer per rimuovere duplicati in tempo reale
    const observer = new MutationObserver(() => {
      this.removeDuplicateEvents();
    });
    
    observer.observe(calendarEl, {
      childList: true,
      subtree: true
    });
  }

  private setupFormValidation(): void {
    // Validazione dinamica del campo data
    const bookingDateInput = document.getElementById('bookingDate') as HTMLInputElement;
    if (bookingDateInput) {
      bookingDateInput.addEventListener('change', () => {
        const selectedDate = new Date(bookingDateInput.value);
        selectedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          alert('⚠️ Non è possibile prenotare per giorni passati.\n\nLa data è stata reimpostata a oggi.');
          const todayISO = today.toISOString().split('T')[0];
          bookingDateInput.value = todayISO;
          this.bookingForm.patchValue({ date: todayISO });
        }
      });
    }
    
    // Validazione dinamica dell'orario per la data odierna
    const bookingStartTimeInput = document.getElementById('bookingStartTime') as HTMLInputElement;
    if (bookingStartTimeInput) {
      bookingStartTimeInput.addEventListener('change', () => {
        const selectedDate = new Date(bookingDateInput?.value || '');
        selectedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Se la data è oggi, controlla che l'orario non sia nel passato
        if (selectedDate.getTime() === today.getTime()) {
          const now = new Date();
          const [hours, minutes] = bookingStartTimeInput.value.split(':');
          const selectedTime = new Date();
          selectedTime.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), 0, 0);
          
          if (selectedTime < now) {
            alert('⚠️ Non è possibile prenotare per orari passati.\n\nSeleziona un orario futuro.');
            bookingStartTimeInput.value = '';
            this.bookingForm.patchValue({ startTime: '' });
          }
        }
      });
    }
  }

  private setupModalCleanup(): void {
    // Fix per rimuovere il backdrop quando si chiude la modale
    const bookingModalElement = document.getElementById('bookingModal');
    if (bookingModalElement) {
      // Listener per evento Bootstrap
      bookingModalElement.addEventListener('hidden.bs.modal', () => {
        this.cleanupModal();
      });
      
      // Listener manuali per i pulsanti di chiusura
      const closeButtons = bookingModalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.closeModal('bookingModal');
        });
      });
    }
    
    const viewBookingModalElement = document.getElementById('viewBookingModal');
    if (viewBookingModalElement) {
      // Listener per evento Bootstrap
      viewBookingModalElement.addEventListener('hidden.bs.modal', () => {
        this.cleanupModal();
      });
      
      // Listener manuali per i pulsanti di chiusura
      const closeButtons = viewBookingModalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.closeModal('viewBookingModal');
        });
      });
    }
  }

  private closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;
    
    const Bootstrap = (window as any).bootstrap;
    if (Bootstrap && Bootstrap.Modal) {
      try {
        const modal = Bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        } else {
          this.closeModalManually(modalElement);
        }
      } catch (error) {
        this.closeModalManually(modalElement);
      }
    } else {
      this.closeModalManually(modalElement);
    }
    
    // Ripristina lo scroll del body quando la modale viene chiusa
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  private cleanupModal(): void {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  private customizeMoreLinks(cellEl: HTMLElement): void {
    // Cerca tutti i link "+X more" nella cella e li personalizza
    const moreLinks = cellEl.querySelectorAll('.fc-daygrid-more-link');
    moreLinks.forEach((link: any) => {
      // Aggiungi classe personalizzata
      link.classList.add('fc-more-link-custom');
      
      // Se non ha già l'icona, aggiungila
      if (!link.querySelector('i')) {
        const icon = document.createElement('i');
        icon.className = 'ri-calendar-check-line';
        icon.style.marginRight = '4px';
        link.insertBefore(icon, link.firstChild);
      }
      
      // In mobile, intercetta il click prima che FullCalendar lo gestisca
      if (this.isMobile()) {
        link.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Nascondi qualsiasi popover esistente
          const popovers = document.querySelectorAll('.fc-popover');
          popovers.forEach((popover: any) => {
            popover.style.display = 'none';
            popover.remove();
          });
          
          // Estrai la data dal link
          const dayEl = link.closest('.fc-day');
          if (dayEl) {
            const dateStr = dayEl.getAttribute('data-date');
            if (dateStr) {
              const date = new Date(dateStr);
              this.handleMoreLinkClickMobile({ date });
            }
          }
        }, true); // Usa capture phase per intercettare prima
      }
    });
  }

  private hideMoreLinkIfSingleEvent(cellEl: HTMLElement): void {
    // Su mobile, non nascondere il link - vogliamo mostrarlo invece del badge
    if (this.isMobile()) {
      return;
    }
    
    // Trova il contenitore degli eventi nella cella
    const eventsContainer = cellEl.querySelector('.fc-daygrid-day-events');
    if (!eventsContainer) return;
    
    // Conta gli eventi visibili (escludendo i link "+X more")
    const visibleEvents = eventsContainer.querySelectorAll('.fc-daygrid-event:not(.fc-daygrid-more-link)');
    const moreLinks = eventsContainer.querySelectorAll('.fc-daygrid-more-link');
    
    // IMPORTANTE: Assicura che il primo evento (badge principale) sia sempre visibile
    if (visibleEvents.length > 0) {
      const firstEvent = visibleEvents[0] as HTMLElement;
      firstEvent.style.display = 'inline-block';
      firstEvent.style.visibility = 'visible';
      firstEvent.style.opacity = '1';
      firstEvent.style.position = 'relative';
      firstEvent.style.zIndex = '10';
    }
    
    // Se c'è solo un evento visibile, nascondi tutti i link "+X more" (solo su desktop)
    if (visibleEvents.length === 1 && moreLinks.length > 0) {
      moreLinks.forEach((link: any) => {
        (link as HTMLElement).style.display = 'none';
        (link as HTMLElement).style.visibility = 'hidden';
        (link as HTMLElement).style.opacity = '0';
        (link as HTMLElement).style.height = '0';
        (link as HTMLElement).style.width = '0';
        (link as HTMLElement).style.margin = '0';
        (link as HTMLElement).style.padding = '0';
        (link as HTMLElement).style.position = 'absolute';
        (link as HTMLElement).style.left = '-9999px';
        (link as HTMLElement).style.pointerEvents = 'none';
      });
    }
  }

  private customizeAllMoreLinks(): void {
    // Personalizza tutti i link "+X more" nel calendario
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    // Prima nascondi i link quando c'è solo un evento
    const allDayCells = calendarEl.querySelectorAll('.fc-day');
    allDayCells.forEach((cell: any) => {
      this.hideMoreLinkIfSingleEvent(cell);
    });
    
    const allMoreLinks = calendarEl.querySelectorAll('.fc-daygrid-more-link');
    allMoreLinks.forEach((link: any) => {
      link.classList.add('fc-more-link-custom');
      
      // Se non ha già l'icona, aggiungila
      if (!link.querySelector('i')) {
        const icon = document.createElement('i');
        icon.className = 'ri-calendar-check-line';
        icon.style.marginRight = '4px';
        link.insertBefore(icon, link.firstChild);
      }
      
      // In mobile, intercetta il click prima che FullCalendar lo gestisca
      if (this.isMobile()) {
        // Rimuovi listener esistenti per evitare duplicati
        const newLink = link.cloneNode(true);
        link.parentNode?.replaceChild(newLink, link);
        
        newLink.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Nascondi qualsiasi popover esistente
          const popovers = document.querySelectorAll('.fc-popover');
          popovers.forEach((popover: any) => {
            popover.style.display = 'none';
            popover.remove();
          });
          
          // Estrai la data dal link
          const dayEl = newLink.closest('.fc-day');
          if (dayEl) {
            const dateStr = dayEl.getAttribute('data-date');
            if (dateStr) {
              const date = new Date(dateStr);
              this.handleMoreLinkClickMobile({ date });
            }
          }
        }, true); // Usa capture phase per intercettare prima
      }
    });
  }
  
  private fixMobileEventPositioning(cellEl: HTMLElement): void {
    // Forza il posizionamento corretto degli eventi su mobile
    // Trova tutti i contenitori di eventi nella cella
    const eventsContainers = cellEl.querySelectorAll('.fc-daygrid-day-events');
    eventsContainers.forEach((container: any) => {
      const el = container as HTMLElement;
      // Forza position relative e rimuovi qualsiasi posizionamento assoluto
      el.style.position = 'relative';
      el.style.bottom = 'auto';
      el.style.left = 'auto';
      el.style.right = 'auto';
      el.style.top = 'auto';
      el.style.transform = 'none';
      el.style.margin = '0';
    });
    
    // Trova anche il contenitore bottom se esiste
    const bottomContainer = cellEl.querySelector('.fc-daygrid-day-bottom');
    if (bottomContainer) {
      const el = bottomContainer as HTMLElement;
      el.style.position = 'relative';
      el.style.bottom = 'auto';
      el.style.left = 'auto';
      el.style.right = 'auto';
      el.style.top = 'auto';
    }
    
    // Assicura che la cella stessa abbia position relative
    const dayEl = cellEl.closest('.fc-daygrid-day');
    if (dayEl) {
      const el = dayEl as HTMLElement;
      el.style.position = 'relative';
      el.style.overflow = 'hidden';
    }
    
    // Assicura che il frame abbia position relative
    const frameEl = cellEl.querySelector('.fc-daygrid-day-frame');
    if (frameEl) {
      const el = frameEl as HTMLElement;
      el.style.position = 'relative';
      el.style.overflow = 'hidden';
    }
  }

  private isMobile(): boolean {
    return window.innerWidth <= 767;
  }
  
  private handleMoreLinkClickMobile(info: any): boolean {
    let clickedDate: Date;
    
    // Estrai la data dal click
    if (info.date) {
      clickedDate = new Date(info.date);
    } else if (info.allSegs && info.allSegs.length > 0) {
      // Se abbiamo i segmenti degli eventi, prendi la data dal primo
      clickedDate = new Date(info.allSegs[0].event.start);
    } else {
      return false;
    }
    
    clickedDate.setHours(0, 0, 0, 0);
    
    // Trova tutte le prenotazioni dell'utente per questo giorno
    const userBookings = this.myBookings.filter(booking => {
      const bookingDate = new Date(booking.start);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === clickedDate.getTime();
    });
    
    if (userBookings.length > 0) {
      // Se c'è una sola prenotazione, apri direttamente
      // Se ce ne sono più, apri la prima (o potresti mostrare un menu)
      const userBooking = userBookings[0];
      
      // Crea un oggetto evento nel formato atteso da showBookingDetails
      const eventObj = {
        start: userBooking.start,
        end: userBooking.end,
        extendedProps: userBooking.extendedProps || {}
      };
      
      // Apri direttamente il modal con i dettagli
      this.showBookingDetails(eventObj);
      return true; // Indica che abbiamo gestito il click
    }
    
    return false; // Non abbiamo trovato prenotazioni, lascia il comportamento predefinito
  }
}
