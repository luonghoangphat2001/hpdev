<?php

/**
 * Single Product Meta
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/meta.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see         https://woo.com/document/template-structure/
 * @package     WooCommerce\Templates
 * @version     3.0.0
 */

if (!defined('ABSPATH')) {
	exit;
}

global $product;
?>


<div class="prds-bot">

	<?php do_action('woocommerce_product_meta_start'); ?>
	<div class="t-gr">
		<span class="t-text fw-6">
			<?php esc_html_e('SKU:', 'woocommerce'); ?>
		</span>
		<span class="t-txt">
			<?php echo ($sku = $product->get_sku()) ? $sku : esc_html__('N/A', 'woocommerce'); ?>
		</span>
	</div>
	<?php do_action('woocommerce_product_meta_end'); ?>
	<div class="t-gr">
		<span class="t-text fw-6">
			<?php esc_html_e('Lượt xem:', 'hpdev'); ?>
		</span>
		<span class="t-txt">
			<?php echo hp_get_post_view(); ?>
		</span>
	</div>

</div>