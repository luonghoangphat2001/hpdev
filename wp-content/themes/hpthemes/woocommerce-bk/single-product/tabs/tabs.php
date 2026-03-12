<?php

/**
 * Single Product tabs
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/tabs/tabs.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.8.0
 */

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Filter tabs and allow third parties to add their own.
 *
 * Each tab is an array containing title, callback and priority.
 *
 * @see woocommerce_default_product_tabs()
 */
$product_tabs = apply_filters('woocommerce_product_tabs', array());
$mona_product_ttkt_content = get_field('mona_product_ttkt_content', get_the_ID());
$mona_single_product_policy =  get_field('mona_single_product_policy', get_the_ID());
$product = wc_get_product(get_the_ID());
if (empty($mona_single_product_policy)) {
	$mona_single_product_policy =  get_field('mona_single_product_policy', HP_WC_PRODUCTS);
}
if (!empty($product_tabs)) : ?>
	<div class="prds-tab-lh">
		<div class="prds-box-ul row">
			<?php if (!empty($mona_single_product_policy)) {
				foreach ($mona_single_product_policy as $key => $item) {
			?>
					<div class="col">
						<div class="prds-box-it">
							<div class="prds-box-in">
								<span class="icon">
									<?php echo wp_get_attachment_image($item['images'], 'full') ?>
								</span>
								<div class="t-gr">
									<p class="t-text"> <?php echo $item['title'] ?> </p>
									<p class="t-des"><?php echo $item['content'] ?></p>
								</div>
							</div>
						</div>
					</div>
			<?php 	}
			} ?>
		</div>
	</div>
	<div class="woocommerce-tabs wc-tabs-wrapper">

		<div class="prds-if-row row">
			<div class="col">
				<div class="prds-tab tabJS">
					<div class="prds-tab-in">
						<div class="prds-tab-head">
							<div class="btn-tab tabBtn">
								<span class="t-text">
									<?php _e('Thông tin sản phẩm', 'moanemdia'); ?>
								</span>
							</div>
							<div class="btn-tab tabBtn">
								<span class="t-text">
									<?php _e('Thông tin thêm', 'moanemdia'); ?>
								</span>
							</div>
							<?php if (!empty($mona_product_ttkt_content)) { ?>
								<div class="btn-tab tabBtn">
									<span class="t-text">
										<?php _e('Thông số kĩ thuật', 'moanemdia'); ?>
									</span>
								</div>
							<?php } ?>
						</div>
						<div class="prds-tab-body">
							<input type="checkbox" hidden="" id="show-more">
							<div class="prds-tab-load">


								<div class="prds-tab-panel tabPanel">
									<div class="hp-content">
										<?php the_content(); ?>
									</div>
								</div>
								<div class="prds-tab-panel tabPanel">
									<div class="hp-content">
										<?php wc_display_product_attributes($product); ?>
									</div>
								</div>
								<?php if (!empty($mona_product_ttkt_content)) { ?>
									<div class="prds-tab-panel tabPanel">
										<div class="hp-content">
											<?php echo $mona_product_ttkt_content ?>
										</div>
									</div>
								<?php } ?>

							</div>

						</div>
					</div>
				</div>
			</div>

		</div>

		<?php do_action('woocommerce_product_after_tabs'); ?>
	</div>

<?php endif; ?>