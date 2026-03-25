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

  /** Ripristino DOM dopo spostamento modale su body (fix z-index vs backdrop) */
  private readonly modalDomRestore = new WeakMap<
    HTMLElement,
    { parent: Node; next: ChildNode | null }
  >();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const html = this.document.documentElement;
    const doc = this.document;

    const syncHtmlModalClass = (): void => {
      if (doc.querySelector('.modal.show')) {
        html.classList.add('modal-open');
      } else {
        html.classList.remove('modal-open');
      }
    };

    doc.addEventListener('show.bs.modal', (event: Event) => {
      const modal = event.target as HTMLElement;
      if (!modal?.classList?.contains('modal')) {
        return;
      }
      const parent = modal.parentNode;
      if (!parent || parent === doc.body) {
        html.classList.add('modal-open');
        return;
      }
      this.modalDomRestore.set(modal, { parent, next: modal.nextSibling });
      doc.body.appendChild(modal);
      html.classList.add('modal-open');
    });

    doc.addEventListener('hidden.bs.modal', (event: Event) => {
      const modal = event.target as HTMLElement;
      const place = this.modalDomRestore.get(modal);
      if (place?.parent) {
        place.parent.insertBefore(modal, place.next);
        this.modalDomRestore.delete(modal);
      }
      requestAnimationFrame(syncHtmlModalClass);
    });
  }
}

