<?php

/**
 * The template for displaying archive.
 *
 * @package HP.Media / Website
 */

if (! defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}
get_header();
?>
<div id="primary" class="w-full">
	<main id="main" class="w-full py-12 bg-gray-50 min-h-screen" role="main">
		<div class="max-w-7xl mx-auto px-4">

			<?php if (have_posts()) : ?>

				<div class="mb-10 text-center">
					<?php
					the_archive_title('<h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">', '</h1>');
					the_archive_description('<div class="text-gray-600 max-w-2xl mx-auto">', '</div>');
					?>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					<?php
					while (have_posts()) :
						the_post();
						get_template_part('partials/loop/item');
					endwhile;
					?>
				</div>

				<div class="mt-12 flex justify-center">
					<?php
					the_posts_pagination(array(
						'prev_text' => '<span class="px-3 py-1 border rounded mr-2 hover:bg-gray-100">Previous</span>',
						'next_text' => '<span class="px-3 py-1 border rounded ml-2 hover:bg-gray-100">Next</span>',
						'before_page_number' => '<span class="px-3 py-1 border rounded mx-1 hover:bg-gray-100">',
						'after_page_number' => '</span>',
					));
					?>
				</div>

			<?php

			else :

				get_template_part('partials/content-none');

			endif;
			?>

		</div>
	</main><!-- #main -->
</div><!-- #primary -->
<?php
get_footer();
