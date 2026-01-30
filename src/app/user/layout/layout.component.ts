import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, AfterViewInit {
  currentYear = new Date().getFullYear();
  userName: string = 'Utente';
  isMenuOpen: boolean = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = `${user.nome} ${user.cognome}`;
    }
  }

  ngAfterViewInit(): void {
    // IMPORTANTE: Assicura che lo scroll sia abilitato all'inizializzazione su mobile
    this.ensureScrollEnabled();
    
    // Sovrascrivi il comportamento di app.js DOPO che è stato caricato
    setTimeout(() => {
      const hamburger = document.getElementById('topnav-hamburger-icon');
      if (hamburger) {
        // Rimuovi tutti i listener esistenti clonando l'elemento
        const newHamburger = hamburger.cloneNode(true) as HTMLElement;
        if (hamburger.parentNode) {
          hamburger.parentNode.replaceChild(newHamburger, hamburger);
        }
        
        // Aggiungi il nostro listener con priorità massima (capture phase)
        newHamburger.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.toggleMobileMenu(e);
        }, true);
        
        // Aggiungi anche onclick come backup
        (newHamburger as any).onclick = (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.toggleMobileMenu(e);
        };
      }

      // Chiudi il menu quando si clicca su un link (solo su mobile)
      const menuLinks = document.querySelectorAll('.app-menu .nav-link');
      menuLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 767) {
            this.closeMobileMenu();
          }
        });
      });

      // Inizializza i dropdown Bootstrap
      this.initializeDropdowns();
    }, 1200);
  }

  private initializeDropdowns(): void {
    // Prova a usare Bootstrap se disponibile
    const bootstrap = (window as any).bootstrap;
    
    if (bootstrap && bootstrap.Dropdown) {
      // Usa Bootstrap per inizializzare i dropdown
      const notificationButton = document.getElementById('page-header-notifications-dropdown');
      const userButton = document.getElementById('page-header-user-dropdown');
      
      if (notificationButton) {
        new bootstrap.Dropdown(notificationButton, {
          autoClose: true
        });
      }
      if (userButton) {
        new bootstrap.Dropdown(userButton, {
          autoClose: true
        });
      }
    } else {
      // Fallback: inizializzazione manuale
      const notificationButton = document.getElementById('page-header-notifications-dropdown');
      if (notificationButton) {
        notificationButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Chiudi tutti gli altri dropdown
          document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            if (menu !== notificationButton.nextElementSibling) {
              menu.classList.remove('show');
            }
          });
          document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(btn => {
            if (btn !== notificationButton) {
              btn.setAttribute('aria-expanded', 'false');
            }
          });
          
          const dropdown = notificationButton.nextElementSibling as HTMLElement;
          if (dropdown && dropdown.classList.contains('dropdown-menu')) {
            const isOpen = dropdown.classList.contains('show');
            dropdown.classList.toggle('show');
            
            // Gestione posizionamento su mobile
            if (window.innerWidth <= 767.98) {
              // Su mobile usa posizionamento fisso
              dropdown.style.position = 'fixed';
              dropdown.style.right = '10px';
              dropdown.style.left = 'auto';
              dropdown.style.top = '70px';
              dropdown.style.width = 'calc(100vw - 20px)';
              dropdown.style.maxWidth = '350px';
              dropdown.style.zIndex = '1050';
            } else {
              // Su desktop usa posizionamento assoluto
              dropdown.style.position = 'absolute';
              dropdown.style.right = '0';
              dropdown.style.left = 'auto';
              dropdown.style.top = 'auto';
              dropdown.style.width = 'auto';
              dropdown.style.maxWidth = '22rem';
            }
            
            notificationButton.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
          }
        });
      }

      const userButton = document.getElementById('page-header-user-dropdown');
      if (userButton) {
        userButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Chiudi tutti gli altri dropdown
          document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            if (menu !== userButton.nextElementSibling) {
              menu.classList.remove('show');
            }
          });
          document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(btn => {
            if (btn !== userButton) {
              btn.setAttribute('aria-expanded', 'false');
            }
          });
          
          const dropdown = userButton.nextElementSibling as HTMLElement;
          if (dropdown && dropdown.classList.contains('dropdown-menu')) {
            const isOpen = dropdown.classList.contains('show');
            dropdown.classList.toggle('show');
            
            // Gestione posizionamento su mobile
            if (window.innerWidth <= 767.98) {
              // Su mobile usa posizionamento fisso
              dropdown.style.position = 'fixed';
              dropdown.style.right = '10px';
              dropdown.style.left = 'auto';
              dropdown.style.top = '70px';
              dropdown.style.zIndex = '1050';
            } else {
              // Su desktop usa posizionamento assoluto
              dropdown.style.position = 'absolute';
              dropdown.style.right = '0';
              dropdown.style.left = 'auto';
              dropdown.style.top = 'auto';
            }
            
            userButton.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
          }
        });
      }

      // Chiudi i dropdown quando si clicca fuori
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.dropdown')) {
          document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
          });
          document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(btn => {
            btn.setAttribute('aria-expanded', 'false');
          });
        }
      });
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (window.innerWidth > 767 && this.isMenuOpen) {
      this.closeMobileMenu();
    }
    
    // IMPORTANTE: Assicura che lo scroll sia sempre abilitato quando il menu è chiuso su mobile
    this.ensureScrollEnabled();
    
    // Chiudi i dropdown quando si ridimensiona la finestra per evitare problemi di posizionamento
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  toggleMobileMenu(event: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    
    const width = window.innerWidth;
    
    if (width <= 767) {
      this.isMenuOpen = !this.isMenuOpen;
      
      if (this.isMenuOpen) {
        document.body.classList.add('vertical-sidebar-enable');
        document.documentElement.classList.add('vertical-sidebar-enable');
        document.documentElement.setAttribute('data-sidebar-size', 'lg');
        // Blocca lo scroll quando il menu è aperto
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100vh';
        document.body.style.top = '0';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.bottom = '0';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100vh';
      } else {
        this.ensureScrollEnabled();
      }
      
      // Forza il reflow per assicurare che le classi vengano applicate
      document.body.offsetHeight;
    }
  }

  private ensureScrollEnabled(): void {
    if (window.innerWidth <= 767 && !this.isMenuOpen) {
      // Rimuovi gli stili inline che bloccano lo scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.height = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      
      // Rimuovi le classi che bloccano lo scroll
      document.body.classList.remove('vertical-sidebar-enable');
      document.documentElement.classList.remove('vertical-sidebar-enable');
    }
  }

  closeMobileMenu(): void {
    this.isMenuOpen = false;
    this.ensureScrollEnabled();
  }

  logout(): void {
    this.authService.logout();
  }
}

