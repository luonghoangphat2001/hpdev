<?php

/**
 * The template for displaying search.
 *
 * @package HP.Media / Website
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}
get_header();
?>
<div id="primary" class="content-area">
	<main class="main page-prd">
		<?php get_template_part('partials/breadcrumb'); ?>
		<?php if (have_posts()) { ?>
			<section class="sec-anews ss-pd">
				<div class="container">
					<div class="anews">
						<div class="anews-head">
							<div class="head">
								<h2 class="t-title">
									Kết quả tìm kiếm <?php echo get_search_query() ?>
								</h2>
							</div>
						</div>
						<div class="anews-wrap">

							<div class="anews-block" data-aos="fade-up">
								<div class="anews-list row">
									<?php
									while (have_posts()) {
										the_post();
										echo '<div class="col col-3">';
										get_template_part('partials/loop/blog');
										echo '</div>';
									}
									wp_reset_postdata();
									?>
								</div>
								<div class="anews-pagi">
									<?php echo hp_pagination_links(); ?>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		<?php } ?>
	</main>
</div><!-- #primary -->
<?php get_footer();
