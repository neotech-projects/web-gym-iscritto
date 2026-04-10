import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { PasswordResetComponent } from './auth/password-reset/password-reset.component';
import { AccessoPortaComponent } from './user/accesso-porta/accesso-porta.component';
import { LayoutComponent } from './user/layout/layout.component';
import { DashboardComponent } from './user/dashboard/dashboard.component';
import { PrenotaComponent } from './user/prenota/prenota.component';
import { LeMiePrenotazioniComponent } from './user/le-mie-prenotazioni/le-mie-prenotazioni.component';
import { ProfiloUtenteComponent } from './user/profilo-utente/profilo-utente.component';
import { AuthGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  /** Stesso LoginComponent di `/login`; serve a `navigate(['/utenti/login'])` (allineato al naming API `/api/utenti/login`). */
  { path: 'utenti/login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'password-reset', component: PasswordResetComponent },
  { path: 'accesso-porta/', redirectTo: 'accesso-porta', pathMatch: 'full' },
  { path: 'accesso-porta', component: AccessoPortaComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'prenota', component: PrenotaComponent },
      { path: 'le-mie-prenotazioni', component: LeMiePrenotazioniComponent },
      { path: 'profilo-utente', component: ProfiloUtenteComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

