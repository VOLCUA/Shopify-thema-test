class DetailsDisclosure extends HTMLElement {
    constructor() {
        super();
        this.mainDetailsToggle = this.querySelector('details');

        this.addEventListener('keyup', this.onKeyUp);
        this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
        this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;
    }

    onKeyUp(event) {
        if (event.code.toUpperCase() !== 'ESCAPE') return;

        const openDetailsElement = event.target.closest('details[open]');
        if (!openDetailsElement) return;

        const summaryElement = openDetailsElement.querySelector('summary');
        openDetailsElement.removeAttribute('open');
        summaryElement.focus();
    }

    onFocusOut() {
        setTimeout(() => {
            if (!this.contains(document.activeElement)) this.close();
        })
    }

    close() {
        this.mainDetailsToggle.removeAttribute('open');
        this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
    }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }
}

customElements.define('header-menu', HeaderMenu);