<?php
/**
 * The template for displaying taxonomy.
 *
 * @package HP.Media / Website
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

get_header(); 
?>
<div id="primary" class="content-area">
	<main id="main" class="site-main" role="main">

	<?php if ( have_posts() ) : ?>

		<div class="page-header">
			<?php
				the_archive_title( '<h1 class="page-title">', '</h1>' );
				the_archive_description( '<div class="taxonomy-description">', '</div>' );
			?>
		</div><!-- .page-header -->

		<div class="page-lists">
			<?php
			while ( have_posts() ) : 
				the_post();
				get_template_part( 'partials/loop/item' );
			endwhile;
			?>
		</div><!-- .page-lists -->

		<?php
	
	else :

		get_template_part( 'partials/content-none' );

	endif;
	?>

	</main><!-- #main -->
</div><!-- #primary -->
<?php 
get_footer();
