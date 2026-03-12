<?php

/**
 * Cart totals
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/cart-totals.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 2.3.6
 */

defined('ABSPATH') || exit;

?>
<div class="cart_totals carts-od <?php echo (WC()->customer->has_calculated_shipping()) ? 'calculated_shipping' : ''; ?>">
	<div class="carts-od-in mb-16">
		<?php do_action('woocommerce_before_cart_totals'); ?>
		<div class="carts-od-head">

			<span class="t-text t24"><?php esc_html_e('Cart totals', 'woocommerce'); ?></span>
		</div>

		<div cellspacing="0" class=" carts-od-if shop_table shop_table_responsive">

			<div class=" t-gr cart-subtotal">
				<span class="t-text"><?php esc_html_e('Subtotal', 'woocommerce'); ?></span>
				<span class="t-txt" data-title="<?php esc_attr_e('Subtotal', 'woocommerce'); ?>"><?php wc_cart_totals_subtotal_html(); ?></span>
			</div>

			<?php foreach (WC()->cart->get_coupons() as $code => $coupon) : ?>
				<div class=" t-gr cart-discount coupon-<?php echo esc_attr(sanitize_title($code)); ?>">
					<span class="t-text"><?php wc_cart_totals_coupon_label($coupon); ?></span>
					<span class="t-txt" data-title="<?php echo esc_attr(wc_cart_totals_coupon_label($coupon, false)); ?>"><?php wc_cart_totals_coupon_html($coupon); ?></span>
				</div>
			<?php endforeach; ?>



			<?php foreach (WC()->cart->get_fees() as $fee) : ?>
				<div class=" t-gr fee">
					<span class="t-text"><?php echo esc_html($fee->name); ?></span>
					<span class="t-txt" data-title="<?php echo esc_attr($fee->name); ?>"><?php wc_cart_totals_fee_html($fee); ?></span>
				</div>
			<?php endforeach; ?>

			<?php
			if (wc_tax_enabled() && !WC()->cart->display_prices_including_tax()) {
				$taxable_address = WC()->customer->get_taxable_address();
				$estimated_text  = '';

				if (WC()->customer->is_customer_outside_base() && !WC()->customer->has_calculated_shipping()) {
					/* translators: %s location. */
					$estimated_text = sprintf(' <small>' . esc_html__('(estimated for %s)', 'woocommerce') . '</small>', WC()->countries->estimated_for_prefix($taxable_address[0]) . WC()->countries->countries[$taxable_address[0]]);
				}

				if ('itemized' === get_option('woocommerce_tax_total_display')) {
					foreach (WC()->cart->get_tax_totals() as $code => $tax) { // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			?>
						<div class=" t-gr tax-rate tax-rate-<?php echo esc_attr(sanitize_title($code)); ?>">
							<span class="t-text"><?php echo esc_html($tax->label) . $estimated_text; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
													?></span>
							<span class="t-txt" data-title="<?php echo esc_attr($tax->label); ?>"><?php echo wp_kses_post($tax->formatted_amount); ?></span>
						</div>
					<?php
					}
				} else {
					?>
					<div class=" t-gr tax-total">
						<span class="t-text">
							<?php echo esc_html(WC()->countries->tax_or_vat()) . $estimated_text; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
							?>
						</span>
						<span class="t-txt" data-title="<?php echo esc_attr(WC()->countries->tax_or_vat()); ?>"><?php wc_cart_totals_taxes_total_html(); ?></span>
					</div>
			<?php
				}
			}
			?>

			<?php do_action('woocommerce_cart_totals_before_order_total'); ?>

			<div class=" t-gr order-total">
				<span class="t-text"><?php esc_html_e('Total', 'woocommerce'); ?></span>
				<span class="t-txt" data-title="<?php esc_attr_e('Total', 'woocommerce'); ?>"><?php wc_cart_totals_order_total_html(); ?></span>
			</div>

			<?php do_action('woocommerce_cart_totals_after_order_total'); ?>

		</div>

		<div class="wc-proceed-to-checkout">
			<?php do_action('woocommerce_proceed_to_checkout'); ?>
		</div>

		<?php do_action('woocommerce_after_cart_totals'); ?>
	</div>
</div>