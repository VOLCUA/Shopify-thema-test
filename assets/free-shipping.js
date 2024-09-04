class FreeShippingMeter extends HTMLElement {
    constructor() {
        super();
    }

    static free_shipping_message = window.free_shipping_text.free_shipping_message;
    static free_shipping_message_1 = window.free_shipping_text.free_shipping_message_1;
    static free_shipping_message_2 = window.free_shipping_text.free_shipping_message_2;
    static free_shipping_message_3 = window.free_shipping_text.free_shipping_message_3;
    static free_shipping_message_4 = window.free_shipping_text.free_shipping_message_4;
  
    static classProgress1 = 'progress-30';
    static classProgress2 = 'progress-60';
    static classProgress3 = 'progress-100';
    static freeshipPrice = parseInt(window.free_shipping_price);

    connectedCallback() {
        this.freeShippingEligible = 0;
        this.progressBar = this.querySelector('[data-shipping-progress]');
        this.messageElement = this.querySelector('[data-shipping-message]');
        this.textEnabled = this.progressBar?.dataset.textEnabled === 'true';
        this.shipVal = window.free_shipping_text.free_shipping_1;
        this.progressMeter = this.querySelector('[ data-free-shipping-progress-meter]');

        this.addEventListener('change', this.onCartChange.bind(this));

        this.initialize();
    }

    initialize() {
        Shopify.getCart((cart) => {
            this.cart = cart;
            this.calculateProgress(cart);
        })
    }

    onCartChange(e) {
        this.initialize();
    }

    calculateProgress(cart) {
        const cartTotalPrice = parseInt(cart.total_price) / 100;
        let freeShipBar = Math.round((cartTotalPrice * 100) / FreeShippingMeter.freeshipPrice);
        if (freeShipBar >= 100) {
            freeShipBar = 100;
        }
        
        const text = this.getText(cartTotalPrice, freeShipBar);
        const classLabel = this.getClassLabel(freeShipBar);

        this.setProgressWidthAndText(freeShipBar, text, classLabel);
    }

    getText(cartTotalPrice, freeShipBar) {
        let text;

        if (cartTotalPrice == 0) {
            this.progressBar.classList.add('progress-hidden');
            text = '<span>' + FreeShippingMeter.free_shipping_message + ' ' + Shopify.formatMoney(FreeShippingMeter.freeshipPrice * 100, window.money_format) +'!</span>';
        } else if (cartTotalPrice >= FreeShippingMeter.freeshipPrice) {
            this.progressBar.classList.remove('progress-hidden');
            this.freeShippingEligible = 1;
            text = FreeShippingMeter.free_shipping_message_1;
        } else {
            this.progressBar.classList.remove('progress-hidden');
            const remainingPrice = parseInt(FreeShippingMeter.freeshipPrice - cartTotalPrice);
            text = '<span>' + FreeShippingMeter.free_shipping_message_2 + ' </span>' + Shopify.formatMoney(remainingPrice * 100, window.money_format) + '<span> ' +  FreeShippingMeter.free_shipping_message_3 + ' </span><span class="text">' + FreeShippingMeter.free_shipping_message_4 + '</span>';
            this.shipVal = window.free_shipping_text.free_shipping_2;
        }

        return text;
    }

    getClassLabel(freeShipBar) {
        let classLabel;

        if (freeShipBar === 0) {
            classLabel = 'none';
        } else if (freeShipBar <= 30) {
            classLabel = FreeShippingMeter.classProgress1;
        } else  if (freeShipBar <= 60) {
            classLabel = FreeShippingMeter.classProgress2;
        } else if (freeShipBar <= 100) {
            classLabel = FreeShippingMeter.classProgress3;
        } else {
            classLabel = 'progress-free'
        }

        return classLabel;
    }
    
    resetProgressClass(classLabel) {
        this.progressBar.classList.remove('progress-30');
        this.progressBar.classList.remove('progress-60');
        this.progressBar.classList.remove('progress-100');
        this.progressBar.classList.remove('progress-free');

        this.progressBar.classList.add(classLabel);
    }
    
    setProgressWidthAndText(freeShipBar, text, classLabel) {
        setTimeout(() => {
            this.resetProgressClass(classLabel);

            this.progressMeter.style.width = `${freeShipBar}%`;
            if (this.textEnabled) {
                const textWrapper = this.progressMeter.querySelector('.text').innerHTML = `${freeShipBar}%`;
            }

            this.messageElement.innerHTML = text;

            if ((window.show_multiple_currencies && Currency.currentCurrency != shopCurrency) || window.show_auto_currency) {
                Currency.convertAll(window.shop_currency, $('#currencies .active').attr('data-currency'), 'span.money', 'money_format');
            }
        }, 400)
    }
}

window.addEventListener('load', () => {
    customElements.define('free-shipping-component', FreeShippingMeter);
})