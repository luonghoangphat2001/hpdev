<?php

/**
 * Single Product Image
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/product-image.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.8.0
 */

defined('ABSPATH') || exit;

// Note: `wc_get_gallery_image_html` was added in WC 3.3.2 and did not exist prior. This check protects against theme overrides being used on older versions of WC.
if (!function_exists('wc_get_gallery_image_html')) {
	return;
}

global $product;

$columns           = apply_filters('woocommerce_product_thumbnails_columns', 4);
$post_thumbnail_id = $product->get_image_id();
$post_gallery_image_ids      = $product->get_gallery_image_ids();
?>
<div class="prds-block">
	<div class="prds-col-left">
		<div class="prds-sthumb prdsThumbSw">
			<div class="swiper">
				<div class="swiper-wrapper">
					<div class="swiper-slide">
						<div class="prds-sthumb-img">
							<div class="inner">
								<?php echo wp_get_attachment_image($post_thumbnail_id, 'full') ?>
							</div>
						</div>
					</div>
					<?php if (!empty($post_gallery_image_ids)) {
						foreach ($post_gallery_image_ids as $key => $value) { ?>
							<div class="swiper-slide">
								<div class="prds-sthumb-img">
									<div class="inner">
										<?php echo wp_get_attachment_image($value, 'full') ?>
									</div>
								</div>
							</div>
					<?php }
					} ?>
				</div>
			</div>
		</div>
	</div>
	<div class="prds-col-right">
		<div class="prds-smain prdsMainSw">
			<div class="prd-it-head">
				<?php if ($product->is_on_sale()) : ?>

					<div class="t-gr">
						<span class="t-num">-40%</span>
						<span class="t-sale"> Bán chạy nhất </span>
					</div>

				<?php endif; ?>
			</div>
			<div class="swiper">
				<div class="swiper-wrapper">
					<div class="swiper-slide">
						<div class="prds-smain-img">
							<div class="inner">
								<?php echo wp_get_attachment_image($post_thumbnail_id, 'full') ?>
							</div>
						</div>
					</div>
					<?php if (!empty($post_gallery_image_ids)) {
						foreach ($post_gallery_image_ids as $key => $value) { ?>
							<div class="swiper-slide">
								<div class="prds-smain-img">
									<div class="inner">
										<?php echo wp_get_attachment_image($value, 'full') ?>
									</div>
								</div>
							</div>
					<?php }
					} ?>
				</div>
			</div>
		</div>
	</div>
</div>