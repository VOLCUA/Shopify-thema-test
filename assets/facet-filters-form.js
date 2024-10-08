class FacetFiltersForm extends HTMLElement {
    constructor() {
        super();
        this.filterData = [];
        this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
        this.sidebarBlocks = this.querySelectorAll('.facet-filters__item [data-type-list]'); 
        
        const filterDisplayType = this.dataset.filterDisplay

        this.debouncedOnSubmit = debounce((event) => {
            this.onSubmitHandler(event);
        }, 500);

        this.debouncedOnClick = debounce((event) => {
            this.onClickHandler(event);
        }, 500);

        this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));

        if(this.querySelector('#filter-price-apply')){
            this.querySelector('#filter-price-apply').addEventListener('click', this.debouncedOnClick.bind(this));
        }

        if ($('.facets-horizontal .js-filter[style="display: none;"]').length > 0) {
            $('.results-count .results').hide();
        } else {
            $('.results-count .results').show();
        }
        
        sessionStorage.setItem('filterDisplayType', filterDisplayType)
        
        sessionStorage.setItem('productGridId', JSON.stringify(document.getElementById('main-collection-product-grid').dataset.id))
    }

    static setListeners() {
        const onHistoryChange = (event) => {
            const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
            if (searchParams === FacetFiltersForm.searchParamsPrev) return;
            FacetFiltersForm.renderPage(searchParams, null, false);
        }

        window.addEventListener('popstate', onHistoryChange);
    }

    static FacetPriceFilter(priceFilterBlock) {
        if (priceFilterBlock) {
            const htmlElement = document.querySelector(`.js-filter[data-index="${priceFilterBlock.dataset.index}"]`)
            htmlElement.innerHTML = priceFilterBlock.innerHTML
            
            const debouncedOnClick = debounce((event) => {
                FacetFiltersForm.handleClick(event);
            }, 500);    

            if (htmlElement.querySelector('#filter-price-apply')) {
                htmlElement.querySelector('#filter-price-apply').addEventListener('click', debouncedOnClick);
            }
        }
    }

    static toggleActiveFacets(disable = true) {
        document.querySelectorAll('.js-facet-remove').forEach((element) => {
            element.classList.toggle('disabled', disable);
        });
    }

    static renderPage(searchParams, event, updateURLHash = true) {
        FacetFiltersForm.searchParamsPrev = searchParams;

        const sections = FacetFiltersForm.getSections();
        document.body.classList.add('has-scoder-loader');
        
        sections.forEach((section) => {
            const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
            const filterDataUrl = element => element.url === url;

            FacetFiltersForm.filterData.some(filterDataUrl) ?
            FacetFiltersForm.FacetSectionFromCache(filterDataUrl, section, event) :
            FacetFiltersForm.renderSectionFromFetch(url, section, event);
        });

        if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
    }

    static renderSectionFromFetch(url, section, event) {
        fetch(url)
        .then(response => response.text())
        .then((responseText) => {
            const html = responseText;
            FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
            FacetFiltersForm.FacetFilters(html, event);
            FacetFiltersForm.FacetProductGrid(html);
        });

    }

    static FacetSectionFromCache(filterDataUrl, section, event) {
        const html = this.filterData.find(filterDataUrl).html;
        this.FacetFilters(html, event);
        this.FacetProductGrid(html);
    }

    static setProductForWishlist(handle){
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

    static setLocalStorageProductForWishlist() {
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

    static setLocalStorageProductForCompare($link) {
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

    static FacetProductGrid(html) {
        const innerHTML = new DOMParser()
            .parseFromString(html, 'text/html')
            .getElementById('CollectionProductGrid')
            .querySelector('.collection')?.innerHTML;

        document.getElementById('CollectionProductGrid').querySelector('.collection').innerHTML = innerHTML;

        const resultsCount = new DOMParser()
            .parseFromString(html, 'text/html')
            .getElementById('CollectionProductGrid')
            .querySelector('.results-count .count')?.innerHTML;

        if ($('.facets-horizontal .js-filter[style="display: none;"]').length > 0) {
            $('.results-count .results').hide();
        } else {
            $('.results-count .results').show();
            $('.results-count .count').text(resultsCount);
        }

        if ($('.toolbar').length > 0) {
            this.setActiveViewModeMediaQuery(true);
        }

        if(window.compare.show){
            this.setLocalStorageProductForCompare({
                link: $('a[data-compare-link]'),
                onComplete: null
            });
        }

        if(window.wishlist.show){
            this.setLocalStorageProductForWishlist();
        }

        if(window.innerWidth < 1025){
            window.scrollTo({
                top: document.getElementById('CollectionProductGrid').getBoundingClientRect().top + window.pageYOffset - 50,
                behavior: 'smooth'
            });
        }

        document.body.classList.remove('has-scoder-loader');
    }

    static FacetFilters(html, event) {
        const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

        const facetDetailsElements = parsedHTML.querySelectorAll('#FacetFiltersForm .js-filter');
        const indexTarget = event?.target.closest('.js-filter')?.dataset.index;
        const matchesIndex = (element) => element.dataset.index === indexTarget;
        const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
        const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);
        
        facetsToRender.forEach((element) => {
            document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
        });
        if (document.querySelector(`.facets__reset[data-index="${indexTarget}"]`)) {
            document.querySelector(`.facets__reset[data-index="${indexTarget}"]`).style.display = 'block';
        }

        FacetFiltersForm.FacetActiveFacets(parsedHTML);

        if (countsToRender) FacetFiltersForm.FacetCounts(countsToRender, event.target.closest('.js-filter'));

        if (sessionStorage.getItem('filterDisplayType') === 'show-more') {
            const remainingSidebarBlocks = Array.from(facetDetailsElements).filter(element => element.dataset.typeList && element.dataset.index !== indexTarget)
            FacetFiltersForm.renderRemainingFilters(remainingSidebarBlocks)
        }
        
        FacetFiltersForm.FacetPriceFilter(Array.from(facetDetailsElements).find(element => element.dataset.typePrice && element.dataset.index !== indexTarget))
    }

    static handleClick(event) {
        event.preventDefault();

        const form = event.target.closest('form');
        const inputs = form.querySelectorAll('input[type="number"]');
        const minInput = inputs[0];
        const maxInput = inputs[1];

        if (maxInput.value) minInput.setAttribute('max', maxInput.value);
        if (minInput.value) maxInput.setAttribute('min', minInput.value);

        if (minInput.value === '') {
            maxInput.setAttribute('min', 0);
            minInput.value = Number(minInput.getAttribute('min'));
        }

        if (maxInput.value === '') {
            minInput.setAttribute('max', maxInput.getAttribute('max'));
            maxInput.value = Number(maxInput.getAttribute('max'));
        }

        const formData = new FormData(form);
        const searchParams = new URLSearchParams(formData).toString();

        FacetFiltersForm.renderPage(searchParams, event);
    }

    static FacetActiveFacets(html) {
        const activeFacetElementSelectors = ['.refined-widgets'];

        activeFacetElementSelectors.forEach((selector) => {
            const activeFacetsElement = html.querySelector(selector);
            if (!activeFacetsElement) return;
            
            var refineBlock =  document.querySelector(selector);
            refineBlock = activeFacetsElement.innerHTML;
            
            if(document.querySelector(selector).querySelector('li')){
                document.querySelector(selector).style.display = "block";
            } else {
                document.querySelector(selector).style.display = "none";
            }
        });

        FacetFiltersForm.toggleActiveFacets(false);
    }

    static FacetCounts(source, target) {
        const countElementSelectors = ['.facets__count'];
        countElementSelectors.forEach((selector) => {
            const targetElement = target.querySelector(selector);
            const sourceElement = source.querySelector(selector);

            if (sourceElement && targetElement) {
                target.querySelector(selector).outerHTML = source.querySelector(selector).outerHTML;
            }
        });
    }

    static updateURLHash(searchParams) {
        history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
    }
    

    static getSections() {
        return [{
            id: 'main-collection-product-grid',
            section: document.getElementById('main-collection-product-grid')?.dataset.id || JSON.parse(sessionStorage.getItem("productGridId")),
        }]
    }

    static setActiveViewModeMediaQuery(ajaxLoading = true){
        var mediaView = document.querySelector('[data-view-as]'),
            mediaViewMobile = document.querySelector('[data-view-as-mobile]'),
            viewMode = mediaView?.querySelector('.icon-mode.active'),
            viewModeMobile = mediaViewMobile?.querySelector('.icon-mode.active'),
            column = parseInt(viewMode?.dataset.col),
            windowWidth = window.innerWidth;

        if (!mediaView || !mediaViewMobile) return

        if(column != 1){
            if(document.querySelector('.sidebar--layout_vertical')){
                if (windowWidth < 768) {
                    if (column == 3 || column == 4 || column == 5) {
                        column = 2;
                        viewMode.classList.remove('active');
                        viewModeMobile.classList.remove('active');
                        mediaView.querySelector('.grid-2').classList.add('active');
                        mediaViewMobile.querySelector('.grid-2').classList.add('active');
                    }
                } else if (windowWidth <= 1100 && windowWidth >= 768) {
                    if (column == 5 || column == 4 || column == 3) {
                        column = 2;
                        viewMode.classList.remove('active');
                        viewModeMobile.classList.remove('active');
                        mediaView.querySelector('.grid-2').classList.add('active');
                        mediaViewMobile.querySelector('.grid-2').classList.add('active');
                    }
                } else if (windowWidth < 1599 && windowWidth > 1100) {
                    if (column == 5 || column == 4) {
                        column = 3;
                        viewMode.classList.remove('active');
                        viewModeMobile.classList.remove('active');
                        mediaView.querySelector('.grid-3').classList.add('active');
                        mediaViewMobile.querySelector('.grid-3').classList.add('active');
                    }
                } else if (windowWidth < 1700 && windowWidth >= 1599) {
                    if (column == 5) {
                        column = 4;
                        viewMode.classList.remove('active');
                        viewModeMobile.classList.remove('active');
                        mediaView.querySelector('.grid-4').classList.add('active');
                        mediaViewMobile.querySelector('.grid-4').classList.add('active');
                    }
                }
            } else{
                if (windowWidth < 768) {
                    if (column == 3 || column == 4 || column == 5) {
                        column = 2;
                        viewMode.classList.remove('active');
                        viewModeMobile.classList.remove('active');
                        mediaView.querySelector('.grid-2').classList.add('active');
                        mediaViewMobile.querySelector('.grid-2').classList.add('active');
                    }
                } else if (windowWidth < 992 && windowWidth >= 768) {
                    if (column == 4 || column == 5) {
                        column = 3;
                        viewMode.classList.remove('active');
                        viewModeMobile.classList.remove('active');
                        mediaView.querySelector('.grid-3').classList.add('active');
                        mediaViewMobile.querySelector('.grid-3').classList.add('active');
                    }
                } else if (windowWidth < 1600 && windowWidth >= 992) {
                    if (column == 5) {
                        column = 4;
                        viewMode.classList.remove('active');
                        viewModeMobile.classList.remove('active');
                        mediaView.querySelector('.grid-4').classList.add('active');
                        mediaViewMobile.querySelector('.grid-4').classList.add('active');
                    }
                }
            }
            
            this.initViewModeLayout(column);
        } else{
            if(ajaxLoading){
                this.initViewModeLayout(column);
            }
        }
    }

    static initViewModeLayout(column) {
        const productListing = document.getElementById('CollectionProductGrid').querySelector('.productListing');

        if (!productListing) return;

        switch (column) {
            case 1:
                productListing.classList.remove('productGrid', 'column-5', 'column-4', 'column-3', 'column-2');
                productListing.classList.add('productList');

                break;

            default:
                switch (column) {
                    case 2:
                        productListing.classList.remove('productList', 'column-5', 'column-4', 'column-3');
                        productListing.classList.add('productGrid', 'column-2');

                        break;
                    case 3:
                        productListing.classList.remove('productList', 'column-5', 'column-4', 'column-2');
                        productListing.classList.add('productGrid', 'column-3');

                        break;
                    case 4:
                        productListing.classList.remove('productList', 'column-5', 'column-3', 'column-2');
                        productListing.classList.add('productGrid', 'column-4');

                        break;
                    case 5:
                        productListing.classList.remove('productList', 'column-4', 'column-3', 'column-2');
                        productListing.classList.add('productGrid', 'column-5');

                        break;
                }
        };
    }

    onClickHandler(event) {
        event.preventDefault();

        const form = event.target.closest('form');
        const inputs = form.querySelectorAll('input[type="number"]');
        const minInput = inputs[0];
        const maxInput = inputs[1];

        if (maxInput.value) minInput.setAttribute('max', maxInput.value);
        if (minInput.value) maxInput.setAttribute('min', minInput.value);

        if (minInput.value === '') {
            maxInput.setAttribute('min', 0);
            minInput.value = Number(minInput.getAttribute('min'));
        }

        if (maxInput.value === '') {
            minInput.setAttribute('max', maxInput.getAttribute('max'));
            maxInput.value = Number(maxInput.getAttribute('max'));
        }

        const formData = new FormData(form);
        const searchParams = new URLSearchParams(formData).toString();

        FacetFiltersForm.renderPage(searchParams, event);
    }

    onSubmitHandler(event) {
        event.preventDefault();
        if(!event.target.classList.contains('filter__price')){
            const formData = new FormData(event.target.closest('form'));
            const searchParams = new URLSearchParams(formData).toString();
            FacetFiltersForm.renderPage(searchParams, event);
        }
    }

    onSubmitHandlerFromSortBy(event, form){
        event.preventDefault();

        if(!event.target.classList.contains('filter__price')){
            const formData = new FormData(form);
            const searchParams = new URLSearchParams(formData).toString();
            FacetFiltersForm.renderPage(searchParams, event);
        }
    }

    onActiveFilterClick(event) {
        event.preventDefault();
        FacetFiltersForm.toggleActiveFacets();
        const url = event.currentTarget.href.indexOf('?') == -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
        FacetFiltersForm.renderPage(url);
    }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('collection-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
    constructor() {
        super();
        this.rangeSliderPrice();
        this.querySelectorAll('input').forEach((element) => {
            element.addEventListener('change', this.onRangeChange.bind(this))
        });
        this.setMinAndMaxValues();
        const numberS = this.querySelectorAll("input[type=number]");
        let value1 = numberS[0].value;
        let value2 = numberS[1].value ;

        this.updateDisplay(value1, value2);
    }       

    onRangeChange(event) {
        this.adjustToValidValues(event.currentTarget);
        this.setMinAndMaxValues();
    }

    setMinAndMaxValues() {
        const inputs = this.querySelectorAll('input');
        const minInput = inputs[0];
        const maxInput = inputs[1];

        if (minInput.value === '') maxInput.setAttribute('min', 0);
        if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
    }

    adjustToValidValues(input) {
        const value = Number(input.value);
        const min = Number(input.getAttribute('min'));
        const max = Number(input.getAttribute('max'));

        if (value < min) input.value = min;
        if (value > max) input.value = max;
    }

    rangeSliderPrice(){
        var rangeType = this.querySelectorAll("input[type=range]"),
            numberS = this.querySelectorAll("input[type=number]");
        
        rangeType.forEach((element) => {
            element.oninput = () => {
                var slide1 = parseFloat(rangeType[0].value),
                    slide2 = parseFloat(rangeType[1].value);

                if (slide1 > slide2) {
                    [slide1, slide2] = [slide2, slide1];
                }

                numberS[0].value = slide1;
                numberS[1].value = slide2;
                this.updateDisplay(numberS[0].value, numberS[1].value);
            }
        });

        numberS.forEach((element) => {
            element.oninput = () => {
                var number1 = parseFloat(numberS[0].value),
                    checkValue1 = number1 != number1,
                    number2 = parseFloat(numberS[1].value),
                    checkValue2 = number2 != number2;

             

                if(!checkValue1){
                    rangeType[0].value = number1;
                }

                if(!checkValue2){
                    rangeType[1].value = number2;
                }   

                if (number1 > number2) {
                    this.updateDisplay(number2, number1);
                } else {
                    this.updateDisplay(number1, number2);
                }
            }
        });
    }

    updateDisplay(value1, value2) {
        const range = this.querySelector("input[type=range]");
        const priceSlideRangeContainer = this.querySelector('.facets__price--slide');
        const max = range.max 
        const width = priceSlideRangeContainer.clientWidth;

        const leftSpace = (parseInt(value1) / parseInt(max)) * width + 'px'
        const rightSpace = (width - (parseInt(value2) / parseInt(max)) * width) + 'px'

        priceSlideRangeContainer.style.setProperty('--left-space', leftSpace)
        priceSlideRangeContainer.style.setProperty('--right-space', rightSpace)
    }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
    constructor() {
        super();
        this.querySelector('a').addEventListener('click', (event) => {
            event.preventDefault();
            const form = this.closest('collection-filters-form') || document.querySelector('collection-filters-form');
            form.onActiveFilterClick(event);
        });
    }
}

customElements.define('facet-remove', FacetRemove);
