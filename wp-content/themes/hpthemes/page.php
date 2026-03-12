<?php

/**
 * The template for displaying page template.
 *
 * @package HP.Media / Website
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

get_header();
while (have_posts()) :
    the_post();
?>
    <div id="primary" class="content-area">
        <main id="main" class="main page-prd" role="main">
            <?php get_template_part('partials/breadcrumb'); ?>
            <div class="sec-carts ss-pd">
                <div class="container">
                    <div class="hp-content">
                        <?php the_content(); ?>
                    </div>
                </div>
            </div>
        </main><!-- #main -->
    </div><!-- #primary -->
<?php
endwhile;
get_footer();
