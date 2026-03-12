<?php

/**
 * The Template for displaying all single products
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see         https://woo.com/document/template-structure/
 * @package     WooCommerce\Templates
 * @version     1.6.4
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly
}

get_header('shop');
hp_set_post_view(); ?>

<main class="main page-prd">
	<?php get_template_part('partials/breadcrumb'); ?>
	<section class="sec-prds ss-pd" data-aos="fade-up">
		<div class="container">
			<?php
			while (have_posts()) :  the_post();
				wc_get_template_part('content', 'single-product');
			endwhile; // end of the loop.  
			?>

		</div>
	</section>
</main>

<?php
get_footer('shop');

/* Omit closing PHP tag at the end of PHP files to avoid "headers already sent" issues. */
