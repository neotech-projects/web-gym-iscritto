# Progetto Palestra Frontend

Progetto Angular per la gestione di una palestra - replica del progetto HTML demo.

## Prerequisiti

- Node.js (versione 18 o superiore)
- npm (versione 9 o superiore)

## Installazione

1. Installa le dipendenze:
```bash
npm install
```

2. **IMPORTANTE**: Copia gli assets dal progetto HTML originale:
   - Copia la cartella `assets` da `C:\NEOTECH\PROGETTO_PALESTRA_DIPENDENTI\HTML\assets` in `src/assets`
   - Assicurati che siano presenti: CSS, JS, immagini, fonts, ecc.

## Sviluppo

Esegui `ng serve` per un server di sviluppo. Naviga su `http://localhost:4200/`. L'applicazione si ricaricherà automaticamente se modifichi uno dei file sorgente.

## Build

Esegui `ng build` per compilare il progetto. I file compilati saranno salvati nella directory `dist/`.

## Struttura del Progetto

```
src/
├── app/
│   ├── auth/               # Modulo autenticazione
│   │   ├── login/          # Componente login
│   │   ├── registrazione/  # Componente registrazione
│   │   └── password-reset/ # Componente recupero password
│   ├── user/               # Modulo area utente
│   │   ├── layout/         # Layout con sidebar
│   │   ├── dashboard/      # Dashboard utente
│   │   ├── prenota/        # Prenotazione macchinari
│   │   ├── le-mie-prenotazioni/ # Lista prenotazioni
│   │   ├── profilo-utente/ # Profilo utente
│   │   └── accesso-porta/  # Accesso porta
│   ├── core/               # Modulo core (servizi singleton, HTTP client)
│   ├── shared/             # Modulo condiviso
│   ├── app.component.*     # Componente principale
│   ├── app.module.ts       # Modulo principale
│   └── app-routing.module.ts # Routing principale
├── assets/                 # File statici (CSS, JS, immagini - da copiare dal progetto HTML)
├── environments/           # Configurazioni ambiente
├── index.html              # HTML principale
├── main.ts                 # Entry point
└── styles.css              # Stili globali
```

## Routing

- `/login` - Pagina di login
- `/registrazione` - Pagina di registrazione
- `/password-reset` - Recupero password
- `/dashboard` - Dashboard utente (con layout sidebar)
- `/dashboard/prenota` - Prenotazione macchinari
- `/dashboard/le-mie-prenotazioni` - Lista prenotazioni
- `/dashboard/profilo-utente` - Profilo utente
- `/dashboard/accesso-porta` - Accesso porta

## Note

- ✅ Gli assets (CSS, JS, immagini) sono stati copiati dal progetto HTML originale
- ✅ I servizi base (AuthService, PrenotazioneService) sono stati creati
- ✅ AuthGuard implementato per proteggere le route autenticate
- ✅ Componenti integrati con i servizi
- ⚠️ I servizi utilizzano dati mock - da sostituire con chiamate API reali quando il backend sarà disponibile

## Servizi

### AuthService
- `login()` - Autenticazione utente
- `register()` - Registrazione nuovo utente
- `logout()` - Logout utente
- `resetPassword()` - Recupero password
- `isAuthenticated()` - Verifica autenticazione
- `getCurrentUser()` - Ottiene utente corrente

### PrenotazioneService
- `getPrenotazioni()` - Lista tutte le prenotazioni
- `getProssimePrenotazioni()` - Lista prossime prenotazioni
- `creaPrenotazione()` - Crea nuova prenotazione
- `annullaPrenotazione()` - Annulla prenotazione
- `getStatistiche()` - Statistiche prenotazioni e allenamenti

## Configurazione API

Modifica i file in `src/environments/` per configurare l'URL dell'API:
- `environment.ts` - Ambiente di sviluppo (default: `http://localhost:3000/api`)
- `environment.prod.ts` - Ambiente di produzione

## Prossimi Sviluppi

1. Implementare chiamate API reali nei servizi
2. Completare componente Prenota con calendario
3. Completare componente Le Mie Prenotazioni
4. Completare componente Profilo Utente
5. Implementare componente Accesso Porta

## Struttura del Progetto

```
src/
├── app/                    # Moduli e componenti dell'applicazione
│   ├── core/               # Modulo core (servizi singleton, HTTP client, interceptors)
│   │   ├── core.module.ts
│   │   └── interceptors/   # HTTP interceptors
│   ├── shared/             # Modulo condiviso (componenti, direttive, pipe riutilizzabili)
│   │   ├── shared.module.ts
│   │   └── components/     # Componenti condivisi (loading, error, search, ecc.)
│   ├── features/           # Moduli delle feature dell'applicazione
│   │   ├── dashboard/      # Dashboard principale
│   │   ├── clienti/        # Modulo clienti (CRUD completo)
│   │   ├── corsi/          # Modulo corsi (CRUD completo)
│   │   ├── trainer/        # Modulo trainer (CRUD completo)
│   │   └── iscrizioni/     # Modulo iscrizioni (CRUD completo)
│   ├── services/           # Servizi per comunicare con l'API
│   ├── models/             # Interfacce TypeScript per i modelli dati
│   ├── app.component.*     # Componente principale
│   ├── app.module.ts       # Modulo principale
│   └── app-routing.module.ts # Modulo di routing
├── assets/                 # File statici (immagini, ecc.)
├── environments/           # Configurazioni per diversi ambienti
│   ├── environment.ts      # Ambiente di sviluppo
│   └── environment.prod.ts # Ambiente di produzione
├── index.html              # File HTML principale
├── main.ts                 # Entry point dell'applicazione
└── styles.css              # Stili globali
```

## Moduli

Il progetto è organizzato seguendo le best practice di Angular:

- **CoreModule**: Contiene servizi singleton, configurazioni globali (HttpClientModule) e HTTP interceptors
- **SharedModule**: Contiene componenti, direttive e pipe condivisi tra più feature (loading spinner, error message, search bar, ecc.)
- **FeaturesModule**: Contiene i moduli delle varie feature dell'applicazione (dashboard, clienti, corsi, trainer, iscrizioni)
- **Lazy Loading**: Tutti i moduli feature utilizzano il lazy loading per ottimizzare le performance

## Tecnologie Utilizzate

- Angular 17
- TypeScript
- RxJS
- CSS3

