import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;
  currentYear = new Date().getFullYear();
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = 'Inserisci email e password';
      return;
    }

    this.loading = true;
    this.error = null;

    this.authService.login(this.email, this.password, this.rememberMe).subscribe({
      next: (response) => {
        // Verifica che l'autenticazione sia stata salvata
        if (this.authService.isAuthenticated()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Errore durante l\'autenticazione';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Credenziali non valide';
        this.loading = false;
        console.error('Errore login:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}

