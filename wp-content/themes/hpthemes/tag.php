<?php

/**
 * The template for displaying tag.
 *
 * @package HP.Media / Website
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}

get_header();
?>
<div id="primary" class="content-area">
	<main class="main page-news">
		<?php get_template_part('partials/breadcrumb'); ?>
		<?php
		$sticky_posts = get_option('sticky_posts');
		$args = array(
			'post_type' => 'post',
			'post_status' => 'publish',
			'posts_per_page' => 4,
			'post__in' => $sticky_posts,
			'order' => 'post__in',
		);

		$the_query_stickey = new WP_Query($args);
		if ($the_query_stickey->have_posts()) {
		?>
			<section class="sec-news ss-pd">
				<div class="container">
					<div class="news" data-aos="fade-up">
						<div class="news-wrap">
							<div class="news-head">
								<div class="head">
									<h2 class="t-title"> Tin tức nổi bật</h2>
								</div>
							</div>
						</div>
						<div class="news-block">
							<div class="news-slider">
								<div class="news-sw SlideMbSw">
									<div class="swiper-container rows">
										<div class="swiper">
											<div class="swiper-wrapper">
												<?php
												while ($the_query_stickey->have_posts()) {
													$the_query_stickey->the_post();
													echo '<div class="swiper-slide col">';
													get_template_part('partials/loop/blog');
													echo '</div>';
												}
												wp_reset_postdata();
												?>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		<?php } ?>

		<?php if (have_posts()) { ?>
			<section class="sec-anews ss-pd-b">
				<div class="container">
					<div class="anews">
						<div class="anews-head">
							<div class="head">
								<h2 class="t-title"> Tất cả bài viết</h2>
							</div>
						</div>
						<div class="anews-wrap">
							<div class="anews-row row">
								<div class="col col-9">
									<div class="anews-block" data-aos="fade-up">
										<div class="anews-list row">
											<?php
											while (have_posts()) {
												the_post();
												echo '<div class="col col-4">';
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
								<div class="col col-3">
									<div class="anews-gr" data-aos="fade-left">
										<?php if (!function_exists('dynamic_sidebar') || !dynamic_sidebar('sidebar')) : ?><?php endif; ?>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		<?php } ?>

		<?php $hp_blog_banner = get_field('hp_blog_banner', HP_PAGE_BLOG);
		if (content_exists($hp_blog_banner)) { ?>
			<section class="sec-abr fix">
				<div class="abr-bg">
					<div class="inner">
						<?php echo wp_get_attachment_image($hp_blog_banner['images'], 'full') ?>
					</div>
				</div>
				<div class="container">
					<div class="abr">
						<div class="abr-ctn" data-aos="fade-up">
							<div class="head">
								<h2 class="t-title">
									<?php echo $hp_blog_banner['title'] ?>
								</h2>
							</div>
							<p class="t-des mb-24">
								<?php echo $hp_blog_banner['content'] ?>
							</p>
							<a class="btn" href="<?php echo $hp_blog_banner['link'] ?>">
								<span class="inner">
									<?php echo $hp_blog_banner['btn'] ?>
								</span>
								<i class="fal fa-arrow-right icon"></i>
							</a>
						</div>
					</div>
				</div>
			</section>
		<?php }  ?>

	</main>
</div><!-- #primary -->
<?php get_footer();
