<?php

/**
 * The Template for displaying product archives, including the main shop page which is a post type archive
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/archive-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.4.0
 */

defined('ABSPATH') || exit;

get_header('shop');

/**
 * Hook: woocommerce_before_main_content.
 *
 * @hooked woocommerce_output_content_wrapper - 10 (outputs opening divs for the content)
 * @hooked woocommerce_breadcrumb - 20
 * @hooked WC_Structured_Data::generate_website_data() - 30
 */
do_action('woocommerce_before_main_content');

?>

<?php get_template_part('partials/breadcrumb'); ?>
<section class="sec-prd ss-pd">
	<div class="container">
		<div class="prd">
			<div class="prd-wrap" data-aos="fade-up">
				<div class="prd-row row">
					<div class="col col-3">
						<div class="prd-cate">
							<?php
							/**
							 * Hook: woocommerce_sidebar.
							 *
							 * @hooked woocommerce_get_sidebar - 10
							 */
							do_action('woocommerce_sidebar');
							?>

						</div>
					</div>
					<div class="col col-9">
						<div class="prd-block">
							<?php
							woocommerce_product_loop_start();

							if (wc_get_loop_prop('total')) {
								while (have_posts()) {
									the_post();
									echo ' <div class="col col-4">';
									/**
									 * Hook: woocommerce_shop_loop.
									 */
									do_action('woocommerce_shop_loop');

									wc_get_template_part('content', 'product');
									echo '	</div>';
								}
							} else {
								echo 'Chưa có sản phẩm phù hợp';
							}

							woocommerce_product_loop_end();
							?>
							<div class="pcate-pagi">
								<?php echo hp_pagination_links(); ?>
							</div>

						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<?php

get_footer('shop');
