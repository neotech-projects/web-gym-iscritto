import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'progetto-palestra-frontend';

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const html = this.document.documentElement;

    const syncHtmlModalClass = (): void => {
      if (this.document.querySelector('.modal.show')) {
        html.classList.add('modal-open');
      } else {
        html.classList.remove('modal-open');
      }
    };

    this.document.addEventListener('show.bs.modal', () => {
      html.classList.add('modal-open');
    });

    this.document.addEventListener('hidden.bs.modal', () => {
      requestAnimationFrame(syncHtmlModalClass);
    });
  }
}

