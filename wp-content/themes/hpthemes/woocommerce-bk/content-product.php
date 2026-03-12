<?php

/**
 * The template for displaying product content within loops
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.6.0
 */

defined('ABSPATH') || exit;

global $product;

// Ensure visibility.
if (empty($product) || !$product->is_visible()) {
	return;
}
?>

<div class="pro-item">
	<div class="pro-box">
		<div class="pro-img">
			<?php echo get_html_sale($product) ?>
			<a class="box" href="<?php echo get_permalink($product->get_id()) ?>">
				<?php
				/**
				 * Hook: woocommerce_before_shop_loop_item_title.
				 *
				 * @hooked woocommerce_show_product_loop_sale_flash - 10
				 * @hooked woocommerce_template_loop_product_thumbnail - 10
				 */
				do_action('woocommerce_before_shop_loop_item_title');
				?>
			</a>
		</div>
		<div class="pro-desc">
			<a class="pro-name" href="<?php echo get_permalink($product->get_id()) ?>">
				<?php
				/**
				 * Hook: woocommerce_shop_loop_item_title.
				 *
				 * @hooked woocommerce_template_loop_product_title - 10
				 */
				do_action('woocommerce_shop_loop_item_title');

				?>
			</a>
			<div class="pro-price">
				<?php
				if (is_front_page()) {
					echo '<span class="pro-text-price">Giá : </span>';
					/**
					 * Hook: woocommerce_after_shop_loop_item_title.
					 *
					 * @hooked woocommerce_template_loop_rating - 5
					 * @hooked woocommerce_template_loop_price - 10
					 */
					do_action('woocommerce_after_shop_loop_item_title');
				} else {
					/**
					 * Hook: woocommerce_after_shop_loop_item_title.
					 *
					 * @hooked woocommerce_template_loop_rating - 5
					 * @hooked woocommerce_template_loop_price - 10
					 */
					do_action('woocommerce_after_shop_loop_item_title');
				}
				?>
			</div>
			<div class="pro-attributes">
				<?php
				if (is_front_page()) {
					$attributes = $product->get_attributes(); // Get all product attributes
					if (! empty($attributes)) {
						foreach ($attributes as $attribute) {
							// Skip variation attributes
							if ($attribute->get_variation()) {
								continue;
							}

							// Get attribute label and value
							$label = wc_attribute_label($attribute->get_name());
							$value = implode(', ', wc_get_product_terms($product->get_id(), $attribute->get_name(), array('fields' => 'names')));

							// Output label and value
							echo '<p>' . esc_html($label) . ': ' . esc_html($value) . '</p>';
						}
					}
				}
				?>
			</div>
		</div>
	</div>
</div>