class Toolbar extends HTMLElement {
    constructor() {
        super();

        this.stickyBounds = document.getElementById('CollectionProductGrid').querySelector('.productListing');
        this.queryParams();
        this.closeModalClick();

        if(this.querySelector('[data-view-as]')){
            this.mediaView = this.querySelector('[data-view-as]');
            this.mediaViewMobile = this.querySelector('[data-view-as-mobile]');

            this.mediaView.querySelectorAll('.icon-mode').forEach((modeButton) => {
                modeButton.addEventListener('click', this.onClickModeButtonHandler.bind(this));
            });

            this.mediaViewMobile.querySelectorAll('.icon-mode').forEach((modeMobileButton) => {
                modeMobileButton.addEventListener('click', this.onClickModeButtonMobileHandler.bind(this));
            });

            var w = window.innerWidth;
            window.addEventListener('load', () => {
                this.debouncedOnResizeMediaQuery();
            });
        }

        if(this.querySelector('[data-toggle]')){
            this.querySelectorAll('[data-toggle]').forEach((dropdownButton) => {
                dropdownButton.addEventListener('click', this.onClickDropdownButtonHandler.bind(this));
            });
        }

        if(this.querySelector('[data-sorting]')){
            this.sortBys = this.querySelectorAll('[data-sorting]');
            const hasItem = this.sortBys[0].querySelector('[data-sort-by-item]') != null
            if(hasItem){
                this.sortBys.forEach(sortBy => {
                    sortBy.querySelectorAll('[data-sort-by-item]').forEach((sortByButton) => {
                        sortByButton.addEventListener('click', this.onClickSortByButtonHandler.bind(this));
                    });
                })
            }
        }

        if(this.checkNeedToConvertCurrency()){
            Currency.convertAll(window.shop_currency, $('#currencies .active').attr('data-currency'), 'span.money', 'money_format');
        }
    }

    queryParams() {
        Shopify.queryParams = {};

        if (location.search.length > 0) {
            for (var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&'); i < aCouples.length; i++) {
                aKeyValue = aCouples[i].split('=');

                if (aKeyValue.length > 1) {
                    Shopify.queryParams[decodeURIComponent(aKeyValue[0])] = decodeURIComponent(aKeyValue[1]);
                }
            }
        }
    }

    createURLHash(baseLink) {
        var newQuery = $.param(Shopify.queryParams).replace(/%2B/g, '+');

        if (baseLink) {
            if (newQuery != "") {
                return baseLink + "?" + newQuery;
            } else {
                return baseLink;
            }
        } else {
            if (newQuery != "") {
                return location.pathname + "?" + newQuery;
            } else {
                return location.pathname;
            }
        }
    }

    updateURLHash(baseLink) {
        delete Shopify.queryParams.page;

        var newUrl = this.createURLHash(baseLink);

        history.pushState({
            param: Shopify.queryParams
        }, newUrl, newUrl);
    }

    checkNeedToConvertCurrency() {
        return (window.show_multiple_currencies && Currency.currentCurrency != shopCurrency) || window.show_auto_currency;
    }

    onClickDropdownButtonHandler(event) {
        var buttonElement = event.currentTarget;

        if (buttonElement.dataset.mobile === 'mobile') {
            document.body.classList.add('toolbar-modal-open')
        }

        if (buttonElement.getAttribute('aria-expanded') === 'false'){
            buttonElement.setAttribute('aria-expanded', true);
        } else {
            buttonElement.setAttribute('aria-expanded', false);
        }
    }

    onClickSortByButtonHandler(event) {
        event.preventDefault();

        var buttonElement = event.currentTarget;
        this.sortBy = buttonElement.closest('[data-sorting]')

        if (!buttonElement.classList.contains('is-active')) {
            var value = buttonElement.querySelector('.text').getAttribute('data-value'),
                href = buttonElement.querySelector('.text').getAttribute('data-href'),
                text = buttonElement.querySelector('.text').innerText;

            if (this.sortBy.querySelector('.label-text') != null) {
                this.sortBy.querySelector('.label-text').innerText = text;
            }

            if (this.sortBy.querySelector('[data-toggle]') != null) {
                this.sortBy.querySelector('[data-toggle]')?.setAttribute('aria-expanded', false);
            }

            this.sortBy.querySelectorAll('[data-sort-by-item]').forEach((sortByButton) => {
                sortByButton.classList.remove('is-active');
            });

            buttonElement.classList.add('is-active');

            if (this.sortBy.dataset.mobile === 'mobile') {
                const dropdownButton = this.querySelector('[data-toggle][data-mobile="mobile"]')
                dropdownButton.setAttribute('aria-expanded', false); 
                document.body.classList.remove('toolbar-modal-open');
            }
            
            if(window.show_storefront_filter) {
                const form = document.querySelector('collection-filters-form');
                    form.querySelector('[name="sort_by"]').value = href;
                    form.onSubmitHandlerFromSortBy(event, form.querySelector('form'));
            } else {
                Shopify.queryParams.sort_by = href;
                this.updateURLHash();

                var newUrl = this.createURLHash();
                this.renderPage(newUrl);
            }
        }
    }

    getSections() {
        return [
            {
                id: 'main-collection-product-grid',
                section: document.getElementById('main-collection-product-grid').dataset.id,
            }
        ]
    }

    renderPage(href) {
        const sections = this.getSections();
        document.body.classList.add('has-scoder-loader');
    }

    renderSidebar(html) {
        if(document.getElementById('main-collection-filters')){
            const innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('main-collection-filters').innerHTML;

            document.getElementById('main-collection-filters').innerHTML = innerHTML;
        }
    }

    setLocalStorageProductForCompare($link) {
        var count = JSON.parse(localStorage.getItem('compareItem')),
            items = $('[data-product-compare-handle]');

        if(count !== null){ 
            if(items.length > 0) {
                items.each((index, element) => {
                    var item = $(element),
                        handle = item.data('product-compare-handle');

                    if(count.indexOf(handle) >= 0) {
                        item.find('.compare-icon').addClass('is-checked');
                        item.find('.text').text(window.compare.added);
                        item.find('input').prop('checked', true);
                    } else {
                        item.find('.compare-icon').removeClass('is-checked');
                        item.find('.text').text(window.compare.add);
                        item.find('input').prop('checked', false);
                    }
                });
            }
        }
    }
  
    setLocalStorageProductForWishlist() {
        var wishlistList = localStorage.getItem('wishlistItem') ? JSON.parse(localStorage.getItem('wishlistItem')) : [];
        localStorage.setItem('wishlistItem', JSON.stringify(wishlistList));

        if (wishlistList.length > 0) {
            wishlistList = JSON.parse(localStorage.getItem('wishlistItem'));
            
            wishlistList.forEach((handle) => {
                this.setProductForWishlist(handle);
            });
        }
        $('[data-wishlist-count]').text(wishlistList.length);
    }

    setProductForWishlist(handle){
        var wishlistList = JSON.parse(localStorage.getItem('wishlistItem')),
            item = $('[data-wishlist-handle="'+ handle +'"]'),
            index = wishlistList.indexOf(handle);
        
        if(index >= 0) {
            item
                .addClass('wishlist-added')
                .find('.text')
                .text(window.wishlist.added)
        } else {
            item
                .removeClass('wishlist-added')
                .find('.text')
                .text(window.wishlist.add);
        }
    }

    onClickModeButtonHandler(event){
        event.preventDefault();

        var buttonElement = event.currentTarget,
            viewMode = this.mediaView.querySelector('.icon-mode.active'),
            column = parseInt(buttonElement.dataset.col);

        if(!buttonElement.classList.contains('active')){
            viewMode.classList.remove('active');
            buttonElement.classList.add('active');

            this.mediaViewMobile.querySelectorAll('.icon-mode').forEach((element) => {
                var currentColum = parseInt(element.dataset.col);

                if(currentColum == column){
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            });
        }
    }

    onClickModeButtonMobileHandler(event){
        event.preventDefault();

        var buttonElement = event.currentTarget,
            viewMode = this.mediaViewMobile.querySelector('.icon-mode.active'),
            column = parseInt(buttonElement.dataset.col);

        if(!buttonElement.classList.contains('active')){
            viewMode.classList.remove('active');
            buttonElement.classList.add('active');

            this.mediaView.querySelectorAll('.icon-mode').forEach((element) => {
                var currentColum = parseInt(element.dataset.col);

                if(currentColum == column){
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            });
        }
    }

    onClickLimitButtonHandler(event){
        event.preventDefault();

        var buttonElement = event.currentTarget;

        if(!buttonElement.classList.contains('is-active')){
            var value = parseInt(buttonElement.querySelector('.text').dataset.value);

            this.limitView.querySelector('.label-text').innerText = value;
            this.limitView.querySelector('[data-toggle]').setAttribute('aria-expanded', false);

            this.limitView.querySelectorAll('[data-limited-view-item]').forEach((limitButton) => {
                limitButton.classList.remove('is-active');
            });

            buttonElement.classList.add('is-active');

            $.ajax({
                type: 'POST',
                url: '/cart.js',
                dataType: 'json',
                data: {
                    "attributes[pagination]": value
                },
                success: function (data) {
                    window.location.reload();
                },
                error: function (xhr, text) {
                    alert($.parseJSON(xhr.responseText).description);
                },
            });
        }
    }

    connectedCallback(){
        this.onScrollHandler = this.onScroll.bind(this);
        window.addEventListener('scroll', this.onScrollHandler, false);
    }

    disconnectedCallback() {
        window.removeEventListener('scroll', this.onScrollHandler);
    }

    onScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const offsetScroll = $('#CollectionProductGrid .productListing').offset().top + 100;

        var windowWidth = window.innerWidth;

        if (windowWidth < 1025) {
            if (scrollTop > offsetScroll) {

                if(document.body.classList.contains('scroll-up')){
                    var height = document.querySelector('sticky-header').offsetHeight;

                    this.style.top = `${height}px`;
                } else if(document.body.classList.contains('scroll-down')) {
                    this.style.top = 0;
                }
            }
        }

        this.currentScrollTop = scrollTop;
    }

    closeModalClick() {
        this.closeMobileModal = this.querySelector('[data-sorting][data-mobile] .close-mobile-modal')
        this.closeMobileModal.addEventListener('click', () => {
            const dropdownButton = this.querySelector('[data-toggle][data-mobile="mobile"]')
            dropdownButton.setAttribute('aria-expanded', false); 
            document.body.classList.remove('toolbar-modal-open')
        })
    }
}

customElements.define('toolbar-item', Toolbar);