import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserRoutingModule } from './user-routing.module';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PrenotaComponent } from './prenota/prenota.component';
import { LeMiePrenotazioniComponent } from './le-mie-prenotazioni/le-mie-prenotazioni.component';
import { ProfiloUtenteComponent } from './profilo-utente/profilo-utente.component';
import { AccessoPortaComponent } from './accesso-porta/accesso-porta.component';

@NgModule({
  declarations: [
    LayoutComponent,
    DashboardComponent,
    PrenotaComponent,
    LeMiePrenotazioniComponent,
    ProfiloUtenteComponent,
    AccessoPortaComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UserRoutingModule
  ],
  exports: [
    AccessoPortaComponent
  ]
})
export class UserModule { }

