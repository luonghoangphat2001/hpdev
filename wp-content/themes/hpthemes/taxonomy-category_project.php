<?php

/**
 * Taxonomy archive: category_project
 * Hiển thị danh sách dự án trong một danh mục — pmenu Swiper layout.
 *
 * @author : HP.Media / Website
 */

// Load Swiper + project CSS/JS cho trang taxonomy
add_action( 'wp_enqueue_scripts', function () {
    $p = HP_THEME_PATH;
    $v = THEME_VERSION;
    wp_enqueue_style(  'hp-swiper-css',       $p . '/public/library/swiper/swiper-bundle.min.css', [],              $v );
    wp_enqueue_style(  'hp-project-css',      $p . '/public/css/pages/project.css',                [ 'hp-frontend' ], $v, false );
    wp_enqueue_script( 'hp-swiper',           $p . '/public/library/swiper/swiper-bundle.min.js',  [],              $v, true );
    wp_enqueue_script( 'hp-project-menu',     $p . '/public/scripts/pages/project-menu.js',        [ 'hp-swiper' ], $v, true );
}, 15 );

get_header();

$current_term = get_queried_object();
?>

<main class="main page-template">

    <?php get_template_part( 'partials/breadcrumb' ); ?>

    <!-- pmenu Swiper — danh sách dự án trong danh mục -->
    <section class="pmenu relative overflow-hidden">
        <div class="pmenu-wrap">
            <div class="pmenu-slide pmenuSwiper">
                <div class="swiper">
                    <div class="swiper-wrapper">

                        <?php
                        $projects = new WP_Query( [
                            'post_type'      => 'project',
                            'posts_per_page' => -1,
                            'post_status'    => 'publish',
                            'orderby'        => 'menu_order date',
                            'order'          => 'ASC',
                            'tax_query'      => [ [
                                'taxonomy' => 'category_project',
                                'field'    => 'term_id',
                                'terms'    => $current_term->term_id,
                            ] ],
                        ] );

                        if ( $projects->have_posts() ) :
                            while ( $projects->have_posts() ) : $projects->the_post();
                                $thumb_id = get_post_thumbnail_id();
                                $img_url  = $thumb_id
                                    ? wp_get_attachment_image_url( $thumb_id, 'full' )
                                    : '';
                        ?>
                        <div class="swiper-slide">
                            <div class="pmenu-item">
                                <div class="pmenu-box">

                                    <div class="pmenu-box-img">
                                        <div class="pmenu-img scroll-element primary">
                                            <?php if ( $img_url ) : ?>
                                                <img src="<?php echo esc_url( $img_url ); ?>"
                                                     alt="<?php echo esc_attr( get_the_title() ); ?>"
                                                     loading="lazy">
                                            <?php else : ?>
                                                <div style="width:100%;height:100%;background:#1a1a2e;"></div>
                                            <?php endif; ?>
                                        </div>
                                        <div class="pmenu-img scroll-element secondary">
                                            <?php if ( $img_url ) : ?>
                                                <img src="<?php echo esc_url( $img_url ); ?>"
                                                     alt=""
                                                     aria-hidden="true"
                                                     loading="lazy">
                                            <?php endif; ?>
                                        </div>
                                    </div>

                                    <a class="pmenu-desc" href="<?php the_permalink(); ?>">
                                        <span class="title"><?php the_title(); ?></span>
                                        <?php if ( has_excerpt() ) : ?>
                                            <span class="txt">
                                                <?php echo esc_html( wp_trim_words( get_the_excerpt(), 14, '...' ) ); ?>
                                            </span>
                                        <?php endif; ?>
                                    </a>

                                </div>
                            </div>
                        </div>
                        <?php
                            endwhile;
                            wp_reset_postdata();
                        else :
                        ?>
                        <div class="swiper-slide">
                            <div class="pmenu-item">
                                <div class="pmenu-box flex items-center justify-center">
                                    <p class="text-[1.8rem] text-white/70">Chưa có dự án nào trong danh mục này.</p>
                                </div>
                            </div>
                        </div>
                        <?php endif; ?>

                    </div><!-- .swiper-wrapper -->
                </div><!-- .swiper -->

                <div class="pmenu-btn">
                    <div class="swiper-button-next pmenu-btn-next"><span class="txt">Next</span></div>
                    <div class="swiper-button-prev pmenu-btn-prev"><span class="txt">Prev</span></div>
                </div>

            </div><!-- .pmenu-slide -->
        </div><!-- .pmenu-wrap -->

        <!-- Category label overlay -->
        <div class="pmenu-category-label">
            <span><?php echo esc_html( $current_term->name ); ?></span>
        </div>

    </section>

</main>

<?php get_footer(); ?>
