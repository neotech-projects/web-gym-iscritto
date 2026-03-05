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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = request.url;
    const isOurApi = url.startsWith(environment.apiUrl);
    const isLogin = url.includes('/api/utenti/login');
    const isRegister = url.includes('/auth/register');

    if (!isOurApi || isLogin || isRegister) {
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
