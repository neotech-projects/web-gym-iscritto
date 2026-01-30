# Mock Server - Microservizio Prenotazioni e Allenamenti

Questo mock server simula il microservizio esterno che fornisce i dati per la dashboard.

## Installazione

Prima di avviare il mock server, installa le dipendenze:

```bash
npm install
```

## Avvio del Mock Server

Per avviare il mock server, esegui:

```bash
npm run mock:server
```

Il server si avvierà su `http://localhost:3001`

## Endpoint Disponibili

### GET `/api/dashboard/stats`
Restituisce le statistiche della dashboard (prenotazioni e allenamenti).

**Risposta:**
```json
{
  "prenotazioni": 3,
  "allenamenti": 8
}
```

### GET `/api/dashboard/prenotazioni`
Restituisce le prossime prenotazioni dell'utente.

**Risposta:**
```json
[
  {
    "id": 1,
    "data": "2024-01-15",
    "oraInizio": "10:00",
    "oraFine": "11:00",
    "macchinari": ["Cyclette", "Tapis Roulant"],
    "durata": "1h",
    "stato": "Confermata"
  }
]
```

### GET `/api/prenotazioni`
Restituisce tutte le prenotazioni dell'utente corrente.

### GET `/api/prenotazioni/generali`
Restituisce tutte le prenotazioni di tutti gli utenti (per calcolare la disponibilità nella pagina prenota).

**Risposta:**
```json
[
  {
    "id": 1,
    "data": "2024-01-15",
    "oraInizio": "10:00",
    "oraFine": "11:00",
    "utente": "Mario Rossi",
    "macchinari": ["Cyclette", "Tapis Roulant"],
    "durata": "1h",
    "stato": "Confermata"
  },
  {
    "id": 4,
    "data": "2024-01-15",
    "oraInizio": "10:00",
    "oraFine": "11:00",
    "utente": "Luigi Bianchi",
    "macchinari": ["Cyclette"],
    "durata": "1h",
    "stato": "Confermata"
  }
]
```

### GET `/api/prenotazioni/storico`
Restituisce lo storico completo delle prenotazioni dell'utente corrente (future e passate).

**Risposta:**
```json
[
  {
    "id": 1,
    "data": "2024-01-15",
    "oraInizio": "10:00",
    "oraFine": "11:00",
    "macchinari": ["Cyclette", "Tapis Roulant"],
    "durata": "1h",
    "stato": "Confermata"
  },
  {
    "id": 4,
    "data": "2024-01-10",
    "oraInizio": "16:00",
    "oraFine": "17:30",
    "macchinari": ["Cyclette", "Ellittica"],
    "durata": "1h 30m",
    "stato": "Completata"
  }
]
```

### GET `/api/utente/profilo`
Restituisce i dati completi del profilo utente.

**Risposta:**
```json
{
  "id": 1,
  "username": "mario.rossi",
  "email": "mario.rossi@example.com",
  "nome": "Mario",
  "cognome": "Rossi",
  "societa": "Acme Corporation",
  "telefono": "+39 333 123 4567",
  "dataNascita": "1990-05-15",
  "sesso": "Maschio"
}
```

### GET `/api/utente/attivita`
Restituisce le attività recenti dell'utente (check-in, prenotazioni, cancellazioni).

**Risposta:**
```json
[
  {
    "id": 1,
    "date": "02 Dic 2025, 10:00",
    "activity": "Check-in palestra",
    "details": "Ingresso registrato",
    "type": "Check-in"
  },
  {
    "id": 2,
    "date": "01 Dic 2025, 18:15",
    "activity": "Prenotazione macchinario",
    "details": "Cyclette, Tapis Roulant - 15 Gen 2025",
    "type": "Prenotazione"
  },
  {
    "id": 5,
    "date": "28 Nov 2025, 15:20",
    "activity": "Cancellazione prenotazione",
    "details": "Ellittica - 28 Nov 2025",
    "type": "Cancellazione"
  }
]
```

### POST `/api/prenotazioni`
Crea una nuova prenotazione.

**Body:**
```json
{
  "data": "2024-01-20",
  "oraInizio": "14:00",
  "oraFine": "15:00",
  "macchinari": ["Cyclette"],
  "durata": "1h"
}
```

### DELETE `/api/prenotazioni/:id`
Annulla una prenotazione specifica.

### GET `/api/health`
Health check del server.

## Utilizzo

1. Avvia il mock server: `npm run mock:server`
2. Avvia l'applicazione Angular: `npm start`
3. Accedi alla dashboard - i dati verranno caricati automaticamente dal mock server

## Note

- Il mock server simula un delay di rete di 300ms per rendere le chiamate più realistiche
- I dati vengono generati dinamicamente in base alla data corrente
- Il server supporta CORS per permettere le chiamate dall'applicazione Angular

