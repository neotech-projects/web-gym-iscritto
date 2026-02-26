import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User, ProfiloUtente } from '../../services/auth.service';
import { PrenotazioneService, Prenotazione } from '../../services/prenotazione.service';

declare var bootstrap: any;

@Component({
  selector: 'app-profilo-utente',
  templateUrl: './profilo-utente.component.html',
  styleUrls: ['./profilo-utente.component.css']
})
export class ProfiloUtenteComponent implements OnInit {
  user: User | null = null;
  profiloUtente: ProfiloUtente | null = null;
  activeTab: 'personal' | 'password' | 'activity' = 'personal';
  profileForm: FormGroup;
  passwordForm: FormGroup;
  profileData: any = {
    telefono: '',
    dataNascita: '',
    sesso: '',
    societa: ''
  };
  stats = {
    allenamenti: 0,
    prenotazioni: 0
  };
  storicoPrenotazioni: Prenotazione[] = [];
  openActivityAccordions: { [key: string]: boolean } = {};
  
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private prenotazioneService: PrenotazioneService
  ) {
    this.profileForm = this.fb.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      dataNascita: [''],
      sesso: ['Maschio'],
      societa: ['']
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    
    // Carica i dati completi del profilo dal microservizio
    this.loadProfiloUtente();
    
    this.loadStats();
    this.loadActivities();
    
    // Setup listener per la modale
    setTimeout(() => {
      const modalElement = document.getElementById('editProfileModal');
      if (modalElement) {
        modalElement.addEventListener('show.bs.modal', () => {
          this.loadModalData();
        });
      }
    }, 100);
  }

  loadProfiloUtente(): void {
    const utenteId = this.authService.getCurrentUser()?.id;
    if (utenteId == null) return;
    this.authService.getProfiloUtente(utenteId).subscribe(profilo => {
      this.profiloUtente = profilo;
      
      // Aggiorna i dati del profilo
      this.profileData.telefono = profilo.telefono || '';
      this.profileData.dataNascita = profilo.dataNascita ? this.formatDateForDisplay(profilo.dataNascita) : '';
      this.profileData.sesso = profilo.sesso || '';
      const societa = profilo.societaNome ?? profilo.societa ?? '';
      this.profileData.societa = societa;
      
      if (this.user) {
        this.user.societa = societa;
      }
      
      this.profileForm.patchValue({
        nome: profilo.nome,
        cognome: profilo.cognome,
        email: profilo.email,
        telefono: profilo.telefono || '',
        dataNascita: profilo.dataNascita || '',
        sesso: profilo.sesso || 'Maschio',
        societa
      });
    });
  }


  setActiveTab(tab: 'personal' | 'password' | 'activity'): void {
    this.activeTab = tab;
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  loadStats(): void {
    const utenteId = this.authService.getCurrentUser()?.id;
    if (utenteId == null) return;
    this.prenotazioneService.getStatistiche(utenteId).subscribe(stats => {
      this.stats = stats;
    });
  }

  loadActivities(): void {
    const utenteId = this.authService.getCurrentUser()?.id;
    if (utenteId == null) return;
    this.prenotazioneService.getStoricoPrenotazioni(utenteId).subscribe(prenotazioni => {
      this.storicoPrenotazioni = Array.isArray(prenotazioni) ? prenotazioni : [];
      this.storicoPrenotazioni.forEach(p => this.openActivityAccordions['activity' + p.id] = false);
    });
  }

  loadModalData(): void {
    // Carica i dati correnti nel form quando si clicca sul pulsante
    const profilo = this.profiloUtente || this.user;
    this.profileForm.patchValue({
      nome: profilo?.nome || '',
      cognome: profilo?.cognome || '',
      email: profilo?.email || '',
      telefono: this.profileData.telefono,
      dataNascita: this.profileData.dataNascita ? this.formatDateForInput(this.profileData.dataNascita) : (this.profiloUtente?.dataNascita || ''),
      sesso: this.profileData.sesso || this.profiloUtente?.sesso || 'Maschio',
      societa: profilo?.societaNome ?? profilo?.societa ?? this.profileData.societa ?? ''
    });
  }

  saveProfileChanges(): void {
    const formValue = this.profileForm.value;
    
    // Validazione email
    if (!formValue.email || formValue.email.trim() === '') {
      alert('L\'email è obbligatoria!');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formValue.email)) {
      alert('Inserisci un indirizzo email valido!');
      return;
    }
    
    const utenteId = this.authService.getCurrentUser()?.id;
    if (utenteId == null) {
      alert('Sessione scaduta. Effettua nuovamente il login.');
      return;
    }
    
    this.authService.modificaProfilo(utenteId, formValue.email, formValue.telefono || '').subscribe({
      next: (response) => {
        // Aggiorna i dati visualizzati localmente
        if (this.user) {
          this.user.email = formValue.email;
        }
        if (this.profiloUtente) {
          this.profiloUtente.email = formValue.email;
          this.profiloUtente.telefono = formValue.telefono;
        }
        this.profileData.telefono = formValue.telefono;
        
        // Chiudi modale
        const modalElement = document.getElementById('editProfileModal');
        if (modalElement && typeof bootstrap !== 'undefined') {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) modal.hide();
        }
        
        alert('✓ Profilo aggiornato con successo!');
      },
      error: (err) => {
        if (err.status === 400) {
          alert('⚠️ Dati non validi. Verifica i campi inseriti.');
        } else if (err.status === 404) {
          alert('⚠️ Utente non trovato.');
        } else {
          alert('⚠️ Errore durante il salvataggio. Riprova più tardi.');
        }
      }
    });
  }

  changePassword(): void {
    const formValue = this.passwordForm.value;
    
    // Validazione campi vuoti
    if (!formValue.oldPassword || formValue.oldPassword.trim() === '') {
      alert('Inserisci la vecchia password!');
      return;
    }
    
    if (!formValue.newPassword || formValue.newPassword.trim() === '') {
      alert('Inserisci la nuova password!');
      return;
    }
    
    if (!formValue.confirmPassword || formValue.confirmPassword.trim() === '') {
      alert('Conferma la nuova password!');
      return;
    }
    
    // Validazione requisiti password
    if (formValue.newPassword.length < 8) {
      alert('La nuova password deve essere di almeno 8 caratteri!');
      return;
    }
    
    if (!/(?=.*[A-Z])/.test(formValue.newPassword)) {
      alert('La nuova password deve contenere almeno una lettera maiuscola!');
      return;
    }
    
    if (!/(?=.*[0-9])/.test(formValue.newPassword)) {
      alert('La nuova password deve contenere almeno un numero!');
      return;
    }
    
    if (!/(?=.*[!@#$%^&*])/.test(formValue.newPassword)) {
      alert('La nuova password deve contenere almeno un carattere speciale (!@#$%^&*)!');
      return;
    }
    
    if (formValue.newPassword !== formValue.confirmPassword) {
      alert('La nuova password e la conferma non corrispondono!');
      return;
    }
    
    const utenteId = this.authService.getCurrentUser()?.id;
    if (utenteId == null) {
      alert('Sessione scaduta. Effettua nuovamente il login.');
      return;
    }
    
    this.authService.cambiaPassword(utenteId, formValue.oldPassword, formValue.newPassword).subscribe({
      next: () => {
        alert('✓ Password cambiata con successo!');
        this.passwordForm.reset();
      },
      error: (err) => {
        if (err.status === 401) {
          alert('⚠️ La vecchia password inserita non è corretta!\n\nVerifica di aver digitato correttamente la tua password attuale.');
        } else if (err.status === 400) {
          alert('⚠️ Dati non validi. Verifica i campi inseriti.');
        } else if (err.status === 404) {
          alert('⚠️ Utente non trovato. Effettua nuovamente il login.');
        } else {
          alert('⚠️ Errore durante il cambio password. Riprova più tardi.');
        }
      }
    });
  }

  requestPasswordReset(): void {
    const userEmail = this.user?.email || '';
    
    if (confirm(`Verrà inviata una nuova password temporanea all'indirizzo:\n${userEmail}\n\nVuoi procedere?`)) {
      this.authService.resetPassword(userEmail).subscribe(response => {
        alert('✓ Email inviata con successo!\n\nUna nuova password temporanea è stata inviata al tuo indirizzo email.\nControlla la tua casella di posta e utilizza la password ricevuta per accedere.');
      });
    }
  }

  toggleActivityAccordion(id: string): void {
    this.openActivityAccordions[id] = !this.openActivityAccordions[id];
  }

  getActivityAccordionState(id: string): string {
    return this.openActivityAccordions[id] ? 'true' : 'false';
  }

  formatDataPrenotazione(data: string): string {
    if (!data) return '–';
    try {
      const d = new Date(data);
      return isNaN(d.getTime()) ? data : d.toLocaleDateString('it-IT');
    } catch { return data; }
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

  getOrario(p: Prenotazione): string {
    return p?.oraInizio ?? (p as any)?.ora_inizio ?? '';
  }

  getDurata(p: Prenotazione): string {
    const min = p?.durataMinuti ?? (p as any)?.durata_minuti;
    if (min != null) {
      if (min < 60) return `${min} min`;
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return '–';
  }

  getBadgeClass(type: string): string {
    switch (type) {
      case 'Confermata':
        return 'bg-success-subtle text-success';
      case 'Annullata':
        return 'bg-danger-subtle text-danger';
      case 'Completata':
        return 'bg-secondary-subtle text-secondary';
      case 'Check-in':
        return 'bg-primary-subtle text-primary';
      case 'Prenotazione':
        return 'bg-info-subtle text-info';
      case 'Cancellazione':
        return 'bg-danger-subtle text-danger';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  }

  private formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    // Converte da DD/MM/YYYY a YYYY-MM-DD
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  }
}
