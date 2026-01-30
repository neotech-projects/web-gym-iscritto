// Carica gli script dinamicamente invece di usare document.writeln
(function() {
  if (document.querySelectorAll("[toast-list]").length > 0 || 
      document.querySelectorAll("[data-choices]").length > 0 || 
      document.querySelectorAll("[data-provider]").length > 0) {
    
    function loadScript(src) {
      return new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // Carica gli script solo se necessario
    if (document.querySelectorAll("[toast-list]").length > 0) {
      loadScript('https://cdn.jsdelivr.net/npm/toastify-js').catch(function(err) {
        console.warn('Errore caricamento toastify-js:', err);
      });
    }
    
    if (document.querySelectorAll("[data-choices]").length > 0) {
      loadScript('assets/libs/choices.js/public/assets/scripts/choices.min.js').catch(function(err) {
        console.warn('Errore caricamento choices.min.js:', err);
      });
    }
    
    if (document.querySelectorAll("[data-provider]").length > 0) {
      loadScript('assets/libs/flatpickr/flatpickr.min.js').catch(function(err) {
        console.warn('Errore caricamento flatpickr.min.js:', err);
      });
    }
  }
})();