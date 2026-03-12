<?php

/**
 * The template for displaying index.
 *
 * @package HP.Media / Website
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// efine acf
if (get_current_user_id() == 1) {
    define('ACF_LITE', false);
} else {
    define('ACF_LITE', true);
}

define('HP_THEME_PATH', get_template_directory_uri());
define('HP_SITE_URL', get_option('siteurl'));

define('APP_PATH', '/app');
define('CONTROLLER_PATH', APP_PATH . '/controllers');
define('AJAX_PATH', APP_PATH . '/ajax');
define('HELPER_PATH', APP_PATH . '/helpers');
define('MODULE_PATH', APP_PATH . '/modules');

define('CORE_PATH', '/core');
define('FILES_PATH', '/partials');
define('ADMIN_PATH', CORE_PATH . '/admin');
define('ADMIN_INCLUDES_PATH', ADMIN_PATH . '/includes');
define('ADMIN_AJAX_PATH', ADMIN_PATH . '/ajax');

define('THEME_VERSION', '1.1.1');
define('MENU_FILTER_ADMIN', 'hp-filter-admin');
define('FILTER_ADMIN_SETTING', 'HP_Setting_');

// define theme page
define('HP_PAGE_HOME', get_option('page_on_front', true));
define('HP_PAGE_BLOG', get_option('page_for_posts', true));
define('HP_PAGE_ACCOUNT', 13);
define('HP_PAGE_CONTACT', 355);


define('HP_CUSTOM_LOGO', get_theme_mod('custom_logo'));

// Woocommerce
// define('HP_WC_PRODUCTS', get_option('woocommerce_shop_page_id'));
// define('HP_WC_CART', get_option('woocommerce_cart_page_id'));
// define('HP_WC_CHECKOUT', get_option('woocommerce_checkout_page_id'));
// define('HP_WC_MYACCOUNT', get_option('woocommerce_myaccount_page_id'));
// define('HP_WC_THANKYOU', get_option('woocommerce_thanks_page_id'));

@ini_set('upload_max_size', '64M');
@ini_set('post_max_size', '64M');
@ini_set('max_execution_time', '300');
require_once(get_template_directory() . '/__autoload.php');

// (new APIController())->__start();

add_action('template_redirect', 'hp_coming_soon_mode');
function hp_coming_soon_mode()
{
    $active          = (new Hp_Setting_Coming_Soon())->__field_value('active', false);
    $disabledisadmin = (new Hp_Setting_Coming_Soon())->__field_value('disabledisadmin', true);
    $comingSoonPath = get_template_directory() . '/partials/templates/comingsoon/coming-soon.php';
    if ($active) {
        if ($disabledisadmin) {
            if (! current_user_can('manage_options')) {
                if (file_exists($comingSoonPath)) {
                    include($comingSoonPath);
                    exit;
                }
            }
        } elseif (file_exists($comingSoonPath)) {
            include($comingSoonPath);
            exit;
        }
    }
}
