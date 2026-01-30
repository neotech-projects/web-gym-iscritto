import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User, ProfiloUtente, AttivitaRecente } from '../../services/auth.service';
import { PrenotazioneService } from '../../services/prenotazione.service';

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
  activities: AttivitaRecente[] = [];
  openActivityAccordions: { [key: string]: boolean } = {};

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
    this.authService.getProfiloUtente().subscribe(profilo => {
      this.profiloUtente = profilo;
      
      // Aggiorna i dati del profilo
      this.profileData.telefono = profilo.telefono || '';
      this.profileData.dataNascita = profilo.dataNascita ? this.formatDateForDisplay(profilo.dataNascita) : '';
      this.profileData.sesso = profilo.sesso || '';
      this.profileData.societa = profilo.societa || '';
      
      // Aggiorna anche l'utente corrente se necessario
      if (this.user) {
        this.user.societa = profilo.societa;
      }
      
      // Popola il form con i dati del profilo
      this.profileForm.patchValue({
        nome: profilo.nome,
        cognome: profilo.cognome,
        email: profilo.email,
        telefono: profilo.telefono || '',
        dataNascita: profilo.dataNascita || '',
        sesso: profilo.sesso || 'Maschio',
        societa: profilo.societa || ''
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
    this.prenotazioneService.getStatistiche().subscribe(stats => {
      this.stats = stats;
    });
  }

  loadActivities(): void {
    // Carica le attività recenti dal microservizio
    this.authService.getAttivitaRecenti().subscribe(activities => {
      this.activities = activities;
      // Inizializza tutti gli accordion come chiusi
      this.activities.forEach(a => this.openActivityAccordions['activity' + a.id] = false);
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
      societa: profilo?.societa || this.profileData.societa || ''
    });
  }

  saveProfileChanges(): void {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      
      // Aggiorna i dati visualizzati
      if (this.user) {
        this.user.nome = formValue.nome;
        this.user.cognome = formValue.cognome;
        this.user.email = formValue.email;
        this.user.societa = formValue.societa;
      }
      
      this.profileData.telefono = formValue.telefono;
      this.profileData.dataNascita = this.formatDateForDisplay(formValue.dataNascita);
      this.profileData.sesso = formValue.sesso;
      this.profileData.societa = formValue.societa;
      
      // Chiudi modale
      const modalElement = document.getElementById('editProfileModal');
      if (modalElement && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
      }
      
      alert('Profilo aggiornato con successo!');
    } else {
      alert('Per favore, compila tutti i campi obbligatori.');
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      const formValue = this.passwordForm.value;
      
      // Validazione password
      if (formValue.newPassword.length < 8) {
        alert('La password deve essere di almeno 8 caratteri!');
        return;
      }
      
      if (!/(?=.*[A-Z])/.test(formValue.newPassword)) {
        alert('La password deve contenere almeno una lettera maiuscola!');
        return;
      }
      
      if (!/(?=.*[0-9])/.test(formValue.newPassword)) {
        alert('La password deve contenere almeno un numero!');
        return;
      }
      
      if (!/(?=.*[!@#$%^&*])/.test(formValue.newPassword)) {
        alert('La password deve contenere almeno un carattere speciale (!@#$%^&*)!');
        return;
      }
      
      if (formValue.newPassword !== formValue.confirmPassword) {
        alert('Le password non corrispondono!');
        return;
      }
      
      // Qui andrebbe la chiamata API per cambiare la password
      alert('Password cambiata con successo!');
      this.passwordForm.reset();
    }
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

  getBadgeClass(type: string): string {
    switch (type) {
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
