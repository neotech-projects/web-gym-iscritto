import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Se già autenticato, non mostrare il login: redirect a dashboard prima che il componente si attivi. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.hasValidAuth() ? router.createUrlTree(['/dashboard']) : true;
};
