<?php

/**
 * The template for displaying category.
 *
 * @package HP.Media / Website
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}

get_header();
?>
<div id="primary" class="content-area">
	<main class="main category">

		<?php get_template_part('partials/breadcrumb'); ?>

		<?php if (have_posts()) : ?>

			<section class="py-[5rem] max-[768px]:py-[3.5rem]" aria-label="Danh sách bài viết">
				<div class="container">

					<div class="flex items-center justify-between mb-[3.2rem] pb-[1.6rem] border-b border-[#f0f0f0]">
						<h2 class="text-[2.8rem] font-bold text-[#1a1a2e] leading-[1.3] max-[768px]:text-[2.2rem]">
							Tất cả bài viết
						</h2>
						<?php
						$total_posts = $wp_query->found_posts;
						if ($total_posts > 0) :
						?>
							<span class="text-[1.4rem] text-[#888] max-[480px]:hidden">
								<?php echo esc_html($total_posts); ?> bài viết
							</span>
						<?php endif; ?>
					</div>

					<div class="grid grid-cols-3 gap-[2.8rem] max-[1024px]:grid-cols-2 max-[1024px]:gap-[2.4rem] max-[560px]:grid-cols-1 max-[560px]:gap-[2rem]">
						<?php
						while (have_posts()) {
							the_post();
							get_template_part('partials/loop/blog');
						}
						wp_reset_postdata();
						?>
					</div>

					<?php if ($wp_query->max_num_pages > 1) : ?>
						<div class="mt-[4rem] flex justify-center">
							<?php hp_pagination_links(); ?>
						</div>
					<?php endif; ?>

				</div>
			</section>

		<?php else : ?>

			<section class="py-[8rem]" aria-label="Không có bài viết">
				<div class="container">
					<div class="flex flex-col items-center text-center gap-[1.6rem]">
						<i class="far fa-newspaper text-[5rem] text-[#ddd]" aria-hidden="true"></i>
						<p class="text-[1.8rem] text-[#888]">Chưa có bài viết nào.</p>
					</div>
				</div>
			</section>

		<?php endif; ?>

	</main>
</div>
<?php get_footer();
