<?php

/**
 * My Account Dashboard
 *
 * Shows the first intro screen on the account dashboard.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/myaccount/dashboard.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 4.4.0
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}

$allowed_html = array(
	'a' => array(
		'href' => array(),
	),
);

$customer_id = get_current_user_id();

if (!wc_ship_to_billing_address_only() && wc_shipping_enabled()) {
	$get_addresses = apply_filters(
		'woocommerce_my_account_get_addresses',
		array(
			'billing'  => __('Billing address', 'woocommerce'),
			'shipping' => __('Shipping address', 'woocommerce'),
		),
		$customer_id
	);
} else {
	$get_addresses = apply_filters(
		'woocommerce_my_account_get_addresses',
		array(
			'billing' => __('Billing address', 'woocommerce'),
		),
		$customer_id
	);
}

$oldcol = 1;
$col    = 1;
?>

<div class="acc-form">
	<form action="">
		<div class="acc-ctn">
			<p class="t24 fw-7">
				Thông tin khách hàng </p>
			<div class="form-if mt-24">
				<div class="form-list row">
					<div class="col col-4 form-ip"> <span class="t-text">
							Họ và tên của bạn </span>
						<input type="text" placeholder="Nhập tên của bạn">
					</div>
					<div class="col col-4 form-ip"> <span class="t-text">
							Số điện thoại</span>
						<input type="text" placeholder="Nhâp số điện thoại">
					</div>
					<div class="col col-4 form-ip"> <span class="t-text">
							Email</span>
						<input type="text" placeholder="Nhâp email">
					</div>
				</div>
			</div>
		</div>
		<div class="acc-add mt-24">
			<p class="t24 fw-7">
				Thông tin khách hàng </p>
			<div class="form-add mt-24">
				<div class="row">
					
					<?php if (!wc_ship_to_billing_address_only() && wc_shipping_enabled()) : ?>
						<div class="u-columns woocommerce-Addresses col2-set addresses">
						<?php endif; ?>

						<?php foreach ($get_addresses as $name => $address_title) : ?>
							<?php
							$address = wc_get_account_formatted_address($name);
							$col     = $col * -1;
							$oldcol  = $oldcol * -1;
							?>

							<div class="col col-6 u-column<?php echo $col < 0 ? 1 : 2; ?> col-<?php echo $oldcol < 0 ? 1 : 2; ?> woocommerce-Address">
								<header class="woocommerce-Address-title title">
									<h3><?php echo esc_html($address_title); ?></h3>
									<a href="<?php echo esc_url(wc_get_endpoint_url('edit-address', $name)); ?>" class="edit"><?php echo $address ? esc_html__('Edit', 'woocommerce') : esc_html__('Add', 'woocommerce'); ?></a>
								</header>
								<address>
									<?php
									echo $address ? wp_kses_post($address) : esc_html_e('You have not set up this type of address yet.', 'woocommerce');
									?>
								</address>
							</div>

						<?php endforeach; ?>

						<?php if (!wc_ship_to_billing_address_only() && wc_shipping_enabled()) : ?>
						</div>
					<?php endif; ?>
				</div>
			</div>
		</div>
	</form>
</div>

<p>
	<?php
	// /* translators: 1: Orders URL 2: Address URL 3: Account URL. */
	// $dashboard_desc = __( 'From your account dashboard you can view your <a href="%1$s">recent orders</a>, manage your <a href="%2$s">billing address</a>, and <a href="%3$s">edit your password and account details</a>.', 'woocommerce' );
	// if ( wc_shipping_enabled() ) {
	// 	/* translators: 1: Orders URL 2: Addresses URL 3: Account URL. */
	// 	$dashboard_desc = __( 'From your account dashboard you can view your <a href="%1$s">recent orders</a>, manage your <a href="%2$s">shipping and billing addresses</a>, and <a href="%3$s">edit your password and account details</a>.', 'woocommerce' );
	// }
	// printf(
	// 	wp_kses( $dashboard_desc, $allowed_html ),
	// 	esc_url( wc_get_endpoint_url( 'orders' ) ),
	// 	esc_url( wc_get_endpoint_url( 'edit-address' ) ),
	// 	esc_url( wc_get_endpoint_url( 'edit-account' ) )
	// );
	?>
</p>

<?php
/**
 * My Account dashboard.
 *
 * @since 2.6.0
 */
do_action('woocommerce_account_dashboard');

/**
 * Deprecated woocommerce_before_my_account action.
 *
 * @deprecated 2.6.0
 */
do_action('woocommerce_before_my_account');

/**
 * Deprecated woocommerce_after_my_account action.
 *
 * @deprecated 2.6.0
 */
do_action('woocommerce_after_my_account');

/* Omit closing PHP tag at the end of PHP files to avoid "headers already sent" issues. */
