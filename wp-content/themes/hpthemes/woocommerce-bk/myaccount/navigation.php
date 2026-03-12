<?php

/**
 * My Account navigation
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/myaccount/navigation.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 2.6.0
 */

if (!defined('ABSPATH')) {
	exit;
}

do_action('woocommerce_before_account_navigation');
$userid = get_current_user_id();
$user_data = get_userdata($userid);

$account = new UserRoles();
?>


<div class="acc-if">
	<div class="acc-if-head">
		<div class="acc-if-avt">
			<div class="icon-avt preview-img">
				<?php echo get_avt_user(); ?>
			</div>
			<label class="t-gr" for="up-file-avt">
				<span class="t16 fw-6">
					<?php echo $user_data->display_name; ?>
				</span>
				<span class="text">Choose your image</span>
				<input class="upload-image" id="up-file-avt" hidden="" type="file" />
			</label>
		</div>
	</div>
	<div class="acc-if-mid">
		<div class="acc-if-ctr">
			<?php foreach (wc_get_account_menu_items() as $endpoint => $label) :
				$icon = $account->icon_item_menu($endpoint) ?>
				<a class="t-gr <?php echo wc_get_account_menu_item_classes($endpoint); ?>" href="<?php echo esc_url(wc_get_account_endpoint_url($endpoint)); ?>">
					<span class="icon">
						<img src="<?php echo $icon; ?>" alt="" srcset="">
					</span>
					<span class="t-text">
						<?php echo esc_html($label); ?>
					</span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
	<div class="acc-if-bot">
		<div class="acc-if-ctr">
			<a class="t-gr" href="<?php echo wp_logout_url(home_url()); ?>">
				<span class="icon">
					<img src="<?php echo HP_THEME_PATH ?>/public/images/acc-icon4.svg" alt="" />
				</span>
				<span class="t-text">
					Đăng xuất
				</span>
			</a>
		</div>
	</div>
</div>
<?php do_action('woocommerce_after_account_navigation'); ?>