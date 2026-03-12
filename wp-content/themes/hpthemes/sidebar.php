<?php
/**
 * The template for displaying sidebar.
 *
 * @package HP.Media / Website
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * This file is here to avoid the Deprecated Message for sidebar by wp-includes/theme-compat/sidebar.php.
 */

if ( ! function_exists('dynamic_sidebar') || ! dynamic_sidebar( 'blog' ) ) : ?><?php endif;