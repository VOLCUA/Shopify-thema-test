window.compareColor = function() {
    class CompareColor extends HTMLElement {
        constructor() {
            super();

            this.popup = this;
            this.imageList = $(this.querySelector('.scoder-compareColors-image'));
            this.textList = this.querySelector('.scoder-compareColors-text');
            this.sortTable = document.getElementById('comparesortList');

            $(document).on('click', '[data-open-compare-color-popup]', (event) => {
                this.setOpenPopup(event);
            });

            $(document).on('click', '[data-close-compare-color-popup]', (event) => {
                this.setClosePopup(event);
            });

            this.debouncedOnChange = debounce((event) => {
                this.onChangeHandler(event);
            }, 0);

            this.querySelector('ul').addEventListener('input', this.debouncedOnChange.bind(this));

            document.body.addEventListener('click', this.onBodyClickEvent.bind(this));

            if (window.innerWidth >= 1025 && this.sortTable) {
                new Sortable(this.sortTable, {
                    animation: 150
                });
            } else {
                this.onRemoveHandler();
            }
        }

        setOpenPopup(event){
            event.preventDefault();
            event.stopPropagation();

            document.body.classList.add('compare-color-show');
            if (document.body.classList.contains('quick-view-show')) {
                $('.scoder-popup-content .scoder-compare-color-popup').addClass('is-show');
            }
            else {
                $('#MainContent .scoder-compare-color-popup').addClass('is-show');
            }
        }

        setClosePopup(event){
            event.preventDefault();
            event.stopPropagation();

            document.body.classList.remove('compare-color-show');
            $('.scoder-compare-color-popup').removeClass('is-show');
        }

        onChangeHandler(event){
            event.preventDefault();

            var input = event.target,
                label = input.nextElementSibling,
                id = input.value;

            if(input.checked){
                var title = label.getAttribute('title'),
                    image = label.getAttribute('data-variant-img'),
                    item = `<div class="item item-${id} item-compare-color"><span class="image"><img src="${image}" alt="${title}"></span><span class="title text-center">${title}</span></div>`;

                this.imageList.append(item);
            } else {
                this.imageList.find(`.item-${id}`).remove();
            }

            if(this.imageList.children().length > 0){
                this.textList.style.display = 'none';
            } else{
                this.textList.style.display = 'block';
            }
        }

        onRemoveHandler(){
            this.imageList.on('click', '.item', (event) => {
                event.preventDefault();

                var $target = event.currentTarget,
                    itemId = $target.classList[1].replace('item-', ''),
                    optionId = `swatch-compare-color-${itemId}`,
                    item = $(document.getElementById(optionId));

                item.trigger('click');
            });
        }

        onBodyClickEvent(event){
            if(document.body.classList.contains('compare-color-show')){
                if ((!this.contains(event.target)) && ($(event.target).closest('[data-open-compare-color-popup], .scoder-popup-content').length === 0)){
                    this.setClosePopup(event);
                }
            }
        }
    }

    customElements.define('compare-color', CompareColor);
};

var quickViewShow = document.body.classList.contains('quick-view-show'),
    productCompareColor = $('.scoder-productView .productView-compareColor').length;

if (document.body.classList.contains('template-product')) {
    if (!quickViewShow && productCompareColor) {
        window.compareColor();
    } else if (quickViewShow && productCompareColor === 0) {
        window.compareColor();
    }
} else {
    window.compareColor();
}