<?php 
// add_action( 'wp_enqueue_scripts', 'optimizewo_woocommerce_styles', 99 );
function optimizewo_woocommerce_styles() {
	if ( function_exists ( 'is_woocommerce' ) ) {
		if ( !is_woocommerce() 
            && !is_cart() 
            && !is_checkout() 
            && !is_account_page() 
            && !is_product() 
            && !is_product_category() 
            && !is_shop() ) {

			// remove woocommerce css
			wp_deregister_style('woocommerce-general');
			wp_deregister_style('woocommerce-layout');
			wp_deregister_style('woocommerce-smallscreen');
			wp_deregister_style('woocommerce_frontend_styles');
			wp_deregister_style('woocommerce_fancybox_styles');
			wp_deregister_style('woocommerce_chosen_styles');
			wp_deregister_style('woocommerce_prettyPhoto_css');
			wp_deregister_style('woocommerce-inline');
            wp_deregister_style('rtwpvs');
            wp_deregister_style('rtwpvs-tooltip');

			// remove WooCommerce Scripts javascript
			wp_deregister_script('wc_price_slider');
			wp_deregister_script('wc-single-product');
			wp_deregister_script('wc-add-to-cart');
			wp_deregister_script('wc-checkout');
			wp_deregister_script('wc-add-to-cart-variation');
			wp_deregister_script('wc-single-product');
			wp_deregister_script('wc-cart');
			wp_deregister_script('wc-chosen');
			wp_deregister_script('woocommerce');
			wp_deregister_script('prettyPhoto');
			wp_deregister_script('prettyPhoto-init');
			wp_deregister_script('jquery-blockui');
			wp_deregister_script('jquery-placeholder');
			wp_deregister_script('fancybox');
			wp_deregister_script('jqueryui');
            wp_deregister_script('sourcebuster-js');
            wp_deregister_script('wp-polyfill-inert');
            wp_deregister_script('wbvp');
            wp_deregister_script('underscore');

			// remove no-js Script + Body Class
			add_filter( 'body_class', function( $classes ) {
				remove_action( 'wp_footer', 'wc_no_js' );
				$classes = array_diff( $classes, array( 'woocommerce-no-js' ) );
				return array_values( $classes );
			},10, 1 );
		}
	}
}

add_action( 'wp_enqueue_scripts', 'optimizewo_woocommerce_remove_block_css', 100 );
function optimizewo_woocommerce_remove_block_css() {
    wp_dequeue_style( 'wc-block-style' );
}

add_action('wp_enqueue_scripts', 'optimizewo_clear_ajax_cart', 99 );
function optimizewo_clear_ajax_cart() {
	if ( function_exists( 'is_woocommerce' ) ) {
		wp_dequeue_script( 'wc-cart-fragments' );
		wp_deregister_script( 'wc-cart-fragments' );
	}
}
