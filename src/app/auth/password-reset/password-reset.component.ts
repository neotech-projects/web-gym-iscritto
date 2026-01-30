import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent {
  email: string = '';
  currentYear = new Date().getFullYear();
  loading: boolean = false;
  success: boolean = false;
  error: string | null = null;

  constructor(private authService: AuthService) { }

  onSubmit(): void {
    if (!this.email) {
      this.error = 'Inserisci la tua email';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = false;

    this.authService.resetPassword(this.email).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Errore durante l\'invio della email';
        this.loading = false;
        console.error('Errore reset password:', err);
      }
    });
  }
}

