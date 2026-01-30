import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    console.error('Errore durante il bootstrap di Angular:', err);
    // Mostra un messaggio visibile in caso di errore
    document.body.innerHTML = '<div style="padding: 50px; text-align: center;"><h1>Errore di caricamento</h1><p>Controlla la console per i dettagli</p><pre>' + err.toString() + '</pre></div>';
  });

