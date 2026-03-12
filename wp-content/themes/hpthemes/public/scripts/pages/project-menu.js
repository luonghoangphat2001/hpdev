/**
 * project-menu.js
 * Initialises the pmenu Swiper for:
 *  - taxonomy-category_project.php (project list in a category)
 *  - single-project.php (related projects section)
 *
 * Loaded via wp_enqueue_script('hp-project-menu') with Swiper as dependency.
 */

document.addEventListener( 'DOMContentLoaded', function () {

    document.querySelectorAll( '.pmenuSwiper' ).forEach( function ( wrapper ) {

        var nextBtn = wrapper.querySelector( '.pmenu-btn-next' );
        var prevBtn = wrapper.querySelector( '.pmenu-btn-prev' );
        var swiperEl = wrapper.querySelector( '.swiper' );

        if ( ! swiperEl ) return;

        // eslint-disable-next-line no-new
        new Swiper( swiperEl, {
            slidesPerView: 'auto',
            speed: 800,
            grabCursor: true,
            mousewheel: {
                forceToAxis: true,
            },
            keyboard: {
                enabled: true,
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: true,
                pauseOnMouseEnter: true,
            },
            navigation: {
                nextEl: nextBtn,
                prevEl: prevBtn,
            },
            breakpoints: {
                0:    { slidesPerView: 1 },
                768:  { slidesPerView: 2 },
                1024: { slidesPerView: 'auto' },
            },
        } );

    } );

} );
