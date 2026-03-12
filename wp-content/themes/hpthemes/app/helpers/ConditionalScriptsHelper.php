<?php
function do_conditional_enqueue_scripts() {
    $v = THEME_VERSION;
    $p = HP_THEME_PATH;
    $m = $p . '/public/scripts/modules'; // shorthand for modules dir

    // ── CSS: page-specific styles ────────────────────────────────────────────

    if ( is_single() && get_post_type() === 'post' ) {
        wp_enqueue_style( 'hp-single-css', $p . '/public/css/pages/single.css', [ 'hp-frontend' ], $v );
    }

    // Swiper CSS — only pages that have sliders
    if ( is_front_page() || is_home()
        // || is_product()
        || is_singular( 'project' ) || is_tax( 'category_project' )
        || is_page_template( 'page-template/about-template.php' ) ) {
        wp_enqueue_style( 'hp-swiper-css', $p . '/public/library/swiper/swiper-bundle.min.css', [], $v );
    }

    // AOS CSS — breadcrumbs use data-aos on every page
    wp_enqueue_style( 'hp-aos-css', $p . '/public/library/aos/aos.css', [], $v );

    // Select2 CSS
    // if ( is_shop() || is_product_category() || is_tax( 'product_cat' ) ) {
    //     wp_enqueue_style( 'hp-select2-css', $p . '/public/library/select2/select2.min.css', [], $v );
    // }

    // // Gallery / Fancybox CSS
    // if ( is_product() ) {
    //     wp_enqueue_style( 'hp-gallery-css',  $p . '/public/library/gallery/lightgallery.min.css', [], $v );
    //     wp_enqueue_style( 'hp-fancybox-css', $p . '/public/library/fancybox/fancybox.css', [], $v );
    // }

    // ── JS: AOS library — needed everywhere (breadcrumbs + animations) ───────
    wp_enqueue_script( 'hp-aos', $p . '/public/library/aos/aos.js', [], $v, true );

    // ── JS: Base modules — present on every page ─────────────────────────────
    wp_enqueue_script( 'hp-mod-header', $m . '/HeaderModule.js',   [], $v, true );
    wp_enqueue_script( 'hp-mod-mobile', $m . '/MobileModule.js',   [], $v, true );
    wp_enqueue_script( 'hp-mod-popup',  $m . '/PopupModule.js',    [], $v, true );
    wp_enqueue_script( 'hp-mod-side',   $m . '/SideModule.js',     [], $v, true );
    wp_enqueue_script( 'hp-mod-tab',    $m . '/TabModule.js',      [], $v, true );
    wp_enqueue_script( 'hp-mod-check',  $m . '/CheckModule.js',    [], $v, true );
    wp_enqueue_script( 'hp-mod-spt',    $m . '/SptModule.js',      [], $v, true );
    wp_enqueue_script( 'hp-mod-aos',    $m . '/AosModule.js',      [], $v, true );

    // ── JS: Page-specific modules ────────────────────────────────────────────

    // Home / Blog page
    if ( is_front_page() || is_home() ) {
        wp_enqueue_script( 'hp-swiper',      $p . '/public/library/swiper/swiper-bundle.min.js', [], $v, true );
        wp_enqueue_script( 'hp-mod-swiper',  $m . '/SwiperModule.js',  [], $v, true );
        wp_enqueue_script( 'hp-mod-countup', $m . '/CountUpModule.js', [], $v, true );
    }

    // Shop / Product archive / Product category
    // if ( is_shop() || is_product_category() || is_tax( 'product_cat' ) ) {
    //     wp_enqueue_script( 'hp-select2',       $p . '/public/library/select2/select2.min.js', [ 'jquery' ], $v, true );
    //     wp_enqueue_script( 'hp-mod-select2',   $m . '/Select2Module.js',  [], $v, true );
    //     wp_enqueue_script( 'hp-mod-range',     $m . '/RangeModule.js',    [], $v, true );
    //     wp_enqueue_script( 'hp-mod-loadmore',  $m . '/LoadMoreModule.js', [], $v, true );
    //     wp_enqueue_script( 'hp-mod-product',   $m . '/product.js',        [], $v, true );
    // }

    // // Single product
    // if ( is_product() ) {
    //     wp_enqueue_script( 'hp-swiper',       $p . '/public/library/swiper/swiper-bundle.min.js',     [], $v, true );
    //     wp_enqueue_script( 'hp-gallery',      $p . '/public/library/gallery/lightgallery-all.min.js', [], $v, true );
    //     wp_enqueue_script( 'hp-fancybox',     $p . '/public/library/fancybox/fancybox.umd.js',        [], $v, true );
    //     wp_enqueue_script( 'hp-mod-swiper',   $m . '/SwiperModule.js',    [], $v, true );
    //     wp_enqueue_script( 'hp-mod-gallery',  $m . '/GalleryModule.js',   [], $v, true );
    //     wp_enqueue_script( 'hp-mod-plusminus',$m . '/PlusMinusModule.js', [], $v, true );
    // }

    // // Cart
    // if ( is_cart() ) {
    //     wp_enqueue_script( 'hp-mod-plusminus', $m . '/PlusMinusModule.js', [], $v, true );
    // }

    // // Checkout
    // if ( is_checkout() ) {
    //     wp_enqueue_script( 'hp-mod-plusminus', $m . '/PlusMinusModule.js', [], $v, true );
    // }

    // // My Account / Login / Register
    // if ( is_account_page() ) {
    //     wp_enqueue_script( 'hp-mod-users', $m . '/user.js', [], $v, true );
    // }

    // About page template
    if ( is_page_template( 'page-template/about-template.php' ) ) {
        wp_enqueue_script( 'hp-swiper',     $p . '/public/library/swiper/swiper-bundle.min.js', [], $v, true );
        wp_enqueue_script( 'hp-mod-swiper', $m . '/SwiperModule.js', [], $v, true );
    }

    // Single project / Project category
    if ( is_singular( 'project' ) || is_tax( 'category_project' ) ) {
        wp_enqueue_script( 'hp-swiper',       $p . '/public/library/swiper/swiper-bundle.min.js', [], $v, true );
        wp_enqueue_script( 'hp-mod-swiper',   $m . '/SwiperModule.js',          [], $v, true );
        wp_enqueue_script( 'hp-project-menu', $p . '/public/scripts/pages/project-menu.js', [], $v, true );
    }
}
