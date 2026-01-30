import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PrenotaComponent } from './prenota/prenota.component';
import { LeMiePrenotazioniComponent } from './le-mie-prenotazioni/le-mie-prenotazioni.component';
import { ProfiloUtenteComponent } from './profilo-utente/profilo-utente.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'prenota', component: PrenotaComponent },
      { path: 'le-mie-prenotazioni', component: LeMiePrenotazioniComponent },
      { path: 'profilo-utente', component: ProfiloUtenteComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }

