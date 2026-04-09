import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

function normalizeApiBase(base: string | undefined): string {
  if (base == null || !base.trim()) return '';
  return base.replace(/\/+$/, '');
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = request.url;
    const baseRemote = normalizeApiBase(environment.apiServerUrl);
    const isOurApi =
      (baseRemote.length > 0 && url.startsWith(baseRemote));
    const isLogin = url.includes('/api/utenti/login');
    const isRegister = url.includes('/auth/register');
    const isCheckPrenotazione = url.includes('/api/prenotazioni/check-prenotazione');

    if (!isOurApi || isLogin || isRegister || isCheckPrenotazione) {
      return next.handle(request);
    }

    if (!this.auth.hasValidAuth()) {
      this.auth.clearAuthAndRedirectToLogin();
      return throwError(() => new Error('Auth required'));
    }

    const token = this.auth.getToken();
    const user = this.auth.getCurrentUser();
    const utenteId = user?.id;

    if (!token) {
      this.auth.clearAuthAndRedirectToLogin();
      return throwError(() => new Error('Token missing'));
    }

    let params = request.params;
    if (utenteId != null && !params.has('utenteId')) {
      params = params.set('utenteId', String(utenteId));
    }

    const cloned = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      params
    });

    return next.handle(cloned);
  }
}
