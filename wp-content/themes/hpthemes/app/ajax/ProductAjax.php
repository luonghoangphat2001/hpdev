<?php
// add_action('wp_ajax_woocommerce_ajax_add_to_cart', 'woocommerce_ajax_add_to_cart');
// add_action('wp_ajax_nopriv_woocommerce_ajax_add_to_cart', 'woocommerce_ajax_add_to_cart');
// function woocommerce_ajax_add_to_cart()
// {

//     $product_id     = apply_filters('woocommerce_add_to_cart_product_id', absint($_POST['product_id']));
//     $quantity       = empty($_POST['quantity']) ? 1 : wc_stock_amount($_POST['quantity']);
//     $variation_id   = absint($_POST['variation_id']);
//     $attributes     = !empty($_POST['attributes']) ? $_POST['attributes'] : array();
//     $mona_data = [];
//     $passed_validation = apply_filters('woocommerce_add_to_cart_validation', true, $product_id, $quantity);
//     if (!empty($variation_id) && $variation_id > 0 && !empty($attributes)) {
//         $cart_item_key = WC()->cart->add_to_cart($product_id, $quantity, $variation_id, $attributes, $mona_data);
//     } else {
//         $cart_item_key = WC()->cart->add_to_cart($product_id, $quantity, false, false, $mona_data);
//     }

//     if ($passed_validation && $cart_item_key) {

//         do_action('woocommerce_ajax_added_to_cart', $product_id);
//         if ('yes' === get_option('woocommerce_cart_redirect_after_add')) {
//             wc_add_to_cart_message(array($product_id => $quantity), true);
//         }
//         if (isset($_POST['act']) && !empty($_POST['act']) && $_POST['act'] == 'normal') {
//             wp_send_json_success(
//                 [
//                     'title'         => __('Thông báo!', 'monamedia'),
//                     'message'       => __('Sản phẩm đã được thêm vào giỏ hàng của bạn', 'monamedia'),
//                     'redirect'      => get_the_permalink(HP_WC_CHECKOUT)
//                 ]
//             );
//         } else {
//             WC_AJAX::get_refreshed_fragments();
//         }
//     } else {

//         $data = array(
//             'error' => true,
//             'product_url' => apply_filters(
//                 'woocommerce_cart_redirect_after_error',
//                 get_permalink($product_id),
//                 $product_id
//             )
//         );
//         echo wp_send_json($data);
//     }

//     wp_die();
// }
