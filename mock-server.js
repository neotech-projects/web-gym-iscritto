const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Dati mock per le prenotazioni
// L'utente può avere solo UNA prenotazione futura alla volta
const getMockPrenotazioni = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Crea una prenotazione per domani alle 14:00 (sempre futura)
  const bookingDateTime = new Date(`${tomorrow.toISOString().split('T')[0]}T14:00`);
  const now = new Date();
  
  // Se la prenotazione è già passata, trova il prossimo giorno disponibile
  let bookingDate = tomorrow;
  if (bookingDateTime < now) {
    // Se anche domani è passato, usa dopodomani
    bookingDate = new Date(today);
    bookingDate.setDate(bookingDate.getDate() + 2);
  }
  
  // Restituisce sempre una prenotazione futura
  return [
    {
      id: 1,
      data: bookingDate.toISOString().split('T')[0],
      oraInizio: '14:00',
      oraFine: '15:00',
      macchinari: ['Cyclette', 'Tapis Roulant'],
      durata: '1h',
      stato: 'Confermata'
    }
  ];
};

// Dati mock per tutte le prenotazioni (di tutti gli utenti)
const getMockPrenotazioniGenerali = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day2 = new Date(today);
  day2.setDate(day2.getDate() + 2);
  const day3 = new Date(today);
  day3.setDate(day3.getDate() + 3);

  const formatDateISO = (date) => date.toISOString().split('T')[0];
  
  // Controlla se la prenotazione dell'utente è ancora valida (non scaduta)
  const userBookings = getMockPrenotazioni();
  const userPrenotazioni = userBookings.map(booking => ({
    id: booking.id,
    data: booking.data,
    oraInizio: booking.oraInizio,
    oraFine: booking.oraFine,
    utente: 'Mario Rossi',
    macchinari: booking.macchinari,
    durata: booking.durata,
    stato: booking.stato
  }));

  return [
    // Prenotazioni dell'utente corrente (solo quelle future/attive)
    ...userPrenotazioni,
    // Prenotazioni di altri utenti
    {
      id: 4,
      data: formatDateISO(tomorrow),
      oraInizio: '10:00',
      oraFine: '11:00',
      utente: 'Luigi Bianchi',
      macchinari: ['Cyclette'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 5,
      data: formatDateISO(tomorrow),
      oraInizio: '10:00',
      oraFine: '11:00',
      utente: 'Anna Verdi',
      macchinari: ['Tapis Roulant'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 6,
      data: formatDateISO(tomorrow),
      oraInizio: '14:00',
      oraFine: '15:00',
      utente: 'Paolo Neri',
      macchinari: ['Ellittica'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 7,
      data: formatDateISO(tomorrow),
      oraInizio: '18:00',
      oraFine: '19:00',
      utente: 'Sara Romano',
      macchinari: ['Vogatore'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 8,
      data: formatDateISO(tomorrow),
      oraInizio: '18:00',
      oraFine: '19:00',
      utente: 'Marco Esposito',
      macchinari: ['Step'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 9,
      data: formatDateISO(tomorrow),
      oraInizio: '18:00',
      oraFine: '19:00',
      utente: 'Giulia Colombo',
      macchinari: ['Panca Multifunzione'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 10,
      data: formatDateISO(tomorrow),
      oraInizio: '18:00',
      oraFine: '19:00',
      utente: 'Andrea Ferrari',
      macchinari: ['Cyclette'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 11,
      data: formatDateISO(tomorrow),
      oraInizio: '18:00',
      oraFine: '19:00',
      utente: 'Elena Ricci',
      macchinari: ['Tapis Roulant'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 12,
      data: formatDateISO(day2),
      oraInizio: '16:00',
      oraFine: '17:00',
      utente: 'Roberto Marino',
      macchinari: ['Ellittica'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 13,
      data: formatDateISO(day2),
      oraInizio: '16:00',
      oraFine: '17:00',
      utente: 'Francesca Galli',
      macchinari: ['Vogatore'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 14,
      data: formatDateISO(day2),
      oraInizio: '16:00',
      oraFine: '17:00',
      utente: 'Giuseppe Conti',
      macchinari: ['Step'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 15,
      data: formatDateISO(day2),
      oraInizio: '16:00',
      oraFine: '17:00',
      utente: 'Chiara Bruno',
      macchinari: ['Panca Multifunzione'],
      durata: '1h',
      stato: 'Confermata'
    },
    {
      id: 16,
      data: formatDateISO(day3),
      oraInizio: '11:00',
      oraFine: '12:00',
      utente: 'Luca Fontana',
      macchinari: ['Cyclette'],
      durata: '1h',
      stato: 'Confermata'
    }
  ];
};

// Endpoint per le statistiche della dashboard
app.get('/api/dashboard/stats', (req, res) => {
  console.log('📊 [MOCK] Richiesta statistiche dashboard');
  
  // Conta le prenotazioni attive dell'utente
  const prenotazioniAttive = getMockPrenotazioni().length;
  
  const stats = {
    prenotazioni: prenotazioniAttive,
    allenamenti: 8
  };
  
  // Simula un piccolo delay di rete
  setTimeout(() => {
    res.json(stats);
  }, 300);
});

// Endpoint per le prossime prenotazioni
app.get('/api/dashboard/prenotazioni', (req, res) => {
  console.log('📅 [MOCK] Richiesta prossime prenotazioni');
  
  const prenotazioni = getMockPrenotazioni();
  
  // Simula un piccolo delay di rete
  setTimeout(() => {
    res.json(prenotazioni);
  }, 300);
});

// Endpoint per tutte le prenotazioni
app.get('/api/prenotazioni', (req, res) => {
  console.log('📋 [MOCK] Richiesta tutte le prenotazioni');
  
  const prenotazioni = getMockPrenotazioni();
  
  setTimeout(() => {
    res.json(prenotazioni);
  }, 300);
});

// Endpoint per creare una prenotazione
app.post('/api/prenotazioni', (req, res) => {
  console.log('➕ [MOCK] Creazione nuova prenotazione:', req.body);
  
  const nuovaPrenotazione = {
    id: Date.now(),
    ...req.body,
    stato: 'Confermata'
  };
  
  setTimeout(() => {
    res.status(201).json(nuovaPrenotazione);
  }, 300);
});

// Endpoint per la registrazione utente
app.post('/api/auth/register', (req, res) => {
  console.log('📝 [MOCK] Nuova registrazione:', req.body);
  
  setTimeout(() => {
    res.status(201).json({
      success: true,
      message: 'Registrazione completata con successo'
    });
  }, 300);
});

// Endpoint per annullare una prenotazione
app.delete('/api/prenotazioni/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`❌ [MOCK] Annullamento prenotazione ID: ${id}`);
  
  setTimeout(() => {
    res.json({ success: true, message: 'Prenotazione annullata con successo' });
  }, 300);
});

// Dati mock per lo storico completo delle prenotazioni (future e passate)
const getMockStoricoPrenotazioni = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfter2 = new Date(today);
  dayAfter2.setDate(dayAfter2.getDate() + 3);

  const subtractDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };

  const formatDateISO = (date) => date.toISOString().split('T')[0];

  // Prenotazioni future (da getMockPrenotazioni - solo quella attiva dell'utente)
  const userActiveBookings = getMockPrenotazioni();
  const futureBookings = userActiveBookings.map(booking => ({
    id: booking.id,
    data: booking.data,
    oraInizio: booking.oraInizio,
    oraFine: booking.oraFine,
    macchinari: booking.macchinari,
    durata: booking.durata,
    stato: booking.stato
  }));

  // Prenotazioni passate
  const pastBookings = [
    {
      id: 4,
      data: formatDateISO(subtractDays(today, 5)),
      oraInizio: '16:00',
      oraFine: '17:30',
      macchinari: ['Cyclette', 'Ellittica'],
      durata: '1h 30m',
      stato: 'Completata'
    },
    {
      id: 5,
      data: formatDateISO(subtractDays(today, 8)),
      oraInizio: '11:00',
      oraFine: '12:00',
      macchinari: ['Step', 'Vogatore'],
      durata: '1h',
      stato: 'Completata'
    },
    {
      id: 6,
      data: formatDateISO(subtractDays(today, 10)),
      oraInizio: '18:00',
      oraFine: '19:00',
      macchinari: ['Tapis Roulant'],
      durata: '1h',
      stato: 'Completata'
    },
    {
      id: 7,
      data: formatDateISO(subtractDays(today, 15)),
      oraInizio: '10:00',
      oraFine: '11:30',
      macchinari: ['Cyclette', 'Panca Multifunzione'],
      durata: '1h 30m',
      stato: 'Completata'
    },
    {
      id: 8,
      data: formatDateISO(subtractDays(today, 18)),
      oraInizio: '15:00',
      oraFine: '16:00',
      macchinari: ['Ellittica', 'Tapis Roulant', 'Cyclette'],
      durata: '1h',
      stato: 'Completata'
    }
  ];

  return [...futureBookings, ...pastBookings];
};

// Endpoint per tutte le prenotazioni generali (di tutti gli utenti)
app.get('/api/prenotazioni/generali', (req, res) => {
  console.log('📋 [MOCK] Richiesta prenotazioni generali (tutti gli utenti)');
  
  const prenotazioni = getMockPrenotazioniGenerali();
  
  setTimeout(() => {
    res.json(prenotazioni);
  }, 300);
});

// Endpoint per lo storico completo delle prenotazioni (future e passate)
app.get('/api/prenotazioni/storico', (req, res) => {
  console.log('📚 [MOCK] Richiesta storico prenotazioni (future e passate)');
  
  const storico = getMockStoricoPrenotazioni();
  
  setTimeout(() => {
    res.json(storico);
  }, 300);
});

// Endpoint per i dati completi del profilo utente
app.get('/api/utente/profilo', (req, res) => {
  console.log('👤 [MOCK] Richiesta dati profilo utente');
  
  const profilo = {
    id: 1,
    username: 'mario.rossi',
    email: 'mario.rossi@example.com',
    nome: 'Mario',
    cognome: 'Rossi',
    societa: 'Acme Corporation',
    telefono: '+39 333 123 4567',
    dataNascita: '1990-05-15', // Formato YYYY-MM-DD
    sesso: 'Maschio'
  };
  
  setTimeout(() => {
    res.json(profilo);
  }, 300);
});

// Endpoint per le attività recenti dell'utente
app.get('/api/utente/attivita', (req, res) => {
  console.log('📋 [MOCK] Richiesta attività recenti utente');
  
  const today = new Date();
  const formatActivityDate = (date) => {
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const subtractDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };

  const activities = [
    {
      id: 1,
      date: formatActivityDate(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0)),
      activity: 'Check-in palestra',
      details: 'Ingresso registrato',
      type: 'Check-in'
    },
    {
      id: 2,
      date: formatActivityDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 18, 15)),
      activity: 'Prenotazione',
      details: 'Cyclette, Tapis Roulant - 15 Gen 2025',
      type: 'Prenotazione'
    },
    {
      id: 3,
      date: formatActivityDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9, 30)),
      activity: 'Check-in palestra',
      details: 'Ingresso registrato',
      type: 'Check-in'
    },
    {
      id: 4,
      date: formatActivityDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 9, 30)),
      activity: 'Check-in palestra',
      details: 'Ingresso registrato',
      type: 'Check-in'
    },
    {
      id: 5,
      date: formatActivityDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4, 15, 20)),
      activity: 'Cancellazione prenotazione',
      details: 'Ellittica - 28 Nov 2025',
      type: 'Cancellazione'
    },
    {
      id: 6,
      date: formatActivityDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5, 10, 15)),
      activity: 'Prenotazione',
      details: 'Vogatore, Step - 02 Dic 2025',
      type: 'Prenotazione'
    },
    {
      id: 7,
      date: formatActivityDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6, 8, 45)),
      activity: 'Check-in palestra',
      details: 'Ingresso registrato',
      type: 'Check-in'
    }
  ];
  
  setTimeout(() => {
    res.json(activities);
  }, 300);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock server is running' });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Mock server avviato su http://localhost:${PORT}`);
  console.log(`📡 Endpoint disponibili:`);
  console.log(`   GET  /api/dashboard/stats - Statistiche dashboard`);
  console.log(`   GET  /api/dashboard/prenotazioni - Prossime prenotazioni`);
  console.log(`   GET  /api/prenotazioni - Tutte le prenotazioni`);
  console.log(`   GET  /api/prenotazioni/generali - Prenotazioni generali (tutti gli utenti)`);
  console.log(`   GET  /api/prenotazioni/storico - Storico completo prenotazioni (future e passate)`);
  console.log(`   GET  /api/utente/profilo - Dati completi profilo utente`);
  console.log(`   GET  /api/utente/attivita - Attività recenti utente`);
  console.log(`   POST /api/prenotazioni - Crea prenotazione`);
  console.log(`   DELETE /api/prenotazioni/:id - Annulla prenotazione`);
  console.log(`   POST /api/auth/register - Registrazione utente`);
  console.log(`   GET  /api/health - Health check`);
});

