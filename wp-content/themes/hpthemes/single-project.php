<?php

/**
 * Single project template.
 * Layout: pmenu-style hero (full-screen image + animated overlay)
 *         → content section → related projects (same category)
 *
 * Fields: title (WP), content (WP editor), thumbnail (featured image)
 *
 * @author : HP.Media / Website
 */

// Load Swiper + project assets
add_action( 'wp_enqueue_scripts', function () {
    $p = HP_THEME_PATH;
    $v = THEME_VERSION;
    wp_enqueue_style(  'hp-swiper-css',      $p . '/public/library/swiper/swiper-bundle.min.css', [],                $v );
    wp_enqueue_style(  'hp-project-css',     $p . '/public/css/pages/project.css',                [ 'hp-frontend' ], $v, false );
    wp_enqueue_style(  'hp-single-proj-css', $p . '/public/css/pages/single-project.css',         [ 'hp-project-css' ], $v, false );
    wp_enqueue_script( 'hp-swiper',          $p . '/public/library/swiper/swiper-bundle.min.js',  [],                $v, true );
    wp_enqueue_script( 'hp-project-menu',    $p . '/public/scripts/pages/project-menu.js',        [ 'hp-swiper' ],   $v, true );
} );

get_header();

while ( have_posts() ) : the_post();

    $thumb_id      = get_post_thumbnail_id();
    $img_url_full  = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'full' ) : '';

    // Category của project (dùng để nav + related)
    $terms = get_the_terms( get_the_ID(), 'category_project' );
    $primary_term  = ( ! empty( $terms ) && ! is_wp_error( $terms ) ) ? $terms[0] : null;

    // Prev / Next trong cùng danh mục
    $prev_post = get_previous_post( true, '', 'category_project' );
    $next_post = get_next_post( true, '', 'category_project' );
?>

<main class="main page-template">

    <!-- ============================================================
         Hero — pmenu-style: full-screen image, animated dual layers,
         title + excerpt overlay at bottom-left
    ============================================================ -->
    <section class="sp-hero pmenu relative overflow-hidden" style="min-height:100vh;">
        <div class="sp-hero-inner pmenu-wrap" style="height:100vh;">

            <div class="pmenu-box" style="padding:0;">

                <!-- Dual image layers (animated scroll-parallax effect) -->
                <div class="pmenu-box-img sp-hero-img">
                    <div class="pmenu-img scroll-element primary">
                        <?php if ( $img_url_full ) : ?>
                            <img src="<?php echo esc_url( $img_url_full ); ?>"
                                 alt="<?php the_title_attribute(); ?>"
                                 loading="eager">
                        <?php else : ?>
                            <div class="w-full h-full bg-[#1a1a2e]"></div>
                        <?php endif; ?>
                    </div>
                    <div class="pmenu-img scroll-element secondary" aria-hidden="true">
                        <?php if ( $img_url_full ) : ?>
                            <img src="<?php echo esc_url( $img_url_full ); ?>" alt="" loading="lazy">
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent z-[1]"></div>

                <!-- Breadcrumb on top of hero -->
                <div class="absolute top-0 left-0 right-0 z-[3]">
                    <?php get_template_part( 'partials/breadcrumb' ); ?>
                </div>

                <!-- Title + meta overlay -->
                <div class="sp-hero-content pmenu-desc" style="z-index:3; padding:3.2rem;">
                    <?php if ( $primary_term ) : ?>
                        <a href="<?php echo esc_url( get_term_link( $primary_term ) ); ?>"
                           class="sp-badge">
                            <?php echo esc_html( $primary_term->name ); ?>
                        </a>
                    <?php endif; ?>
                    <h1 class="title" itemprop="name"><?php the_title(); ?></h1>
                    <?php if ( has_excerpt() ) : ?>
                        <p class="txt" style="margin-top:0.8rem; max-width:60rem;">
                            <?php echo esc_html( get_the_excerpt() ); ?>
                        </p>
                    <?php endif; ?>
                </div>

                <!-- Scroll indicator -->
                <div class="sp-scroll-hint">
                    <span></span>
                </div>

            </div><!-- .pmenu-box -->
        </div><!-- .sp-hero-inner -->
    </section>

    <!-- ============================================================
         Content section
    ============================================================ -->
    <section class="sp-content-section py-[6rem] max-[768px]:py-[4rem]">
        <div class="container">
            <div class="grid grid-cols-[1fr_30rem] gap-[5rem] items-start max-[1024px]:grid-cols-1 max-[1024px]:gap-[3.2rem]">

                <!-- Article body -->
                <article class="sp-content entry-content text-[1.6rem] leading-[1.85] text-[#333]" itemprop="articleBody">
                    <?php
                    $content = get_the_content();
                    if ( $content ) {
                        echo wp_kses_post( apply_filters( 'the_content', $content ) );
                    }
                    ?>
                </article>

                <!-- Sidebar info -->
                <aside class="sp-sidebar flex flex-col gap-[2.4rem]">

                    <?php if ( $primary_term ) : ?>
                        <div class="sp-sidebar-box">
                            <h3 class="sp-sidebar-label">Lĩnh vực</h3>
                            <a href="<?php echo esc_url( get_term_link( $primary_term ) ); ?>"
                               class="sp-sidebar-tag">
                                <?php echo esc_html( $primary_term->name ); ?>
                            </a>
                        </div>
                    <?php endif; ?>

                    <?php if ( $thumb_id ) : ?>
                        <div class="sp-sidebar-box">
                            <h3 class="sp-sidebar-label">Hình ảnh dự án</h3>
                            <div class="rounded-[1rem] overflow-hidden">
                                <?php echo wp_get_attachment_image( $thumb_id, 'medium_large', false, [
                                    'class' => 'w-full h-auto object-cover',
                                    'alt'   => get_the_title(),
                                ] ); ?>
                            </div>
                        </div>
                    <?php endif; ?>

                    <!-- Prev / Next nav -->
                    <?php if ( $prev_post || $next_post ) : ?>
                        <div class="sp-sidebar-box">
                            <h3 class="sp-sidebar-label">Dự án khác</h3>
                            <div class="flex flex-col gap-[1rem]">
                                <?php if ( $prev_post ) : ?>
                                    <a href="<?php echo esc_url( get_permalink( $prev_post ) ); ?>"
                                       class="sp-nav-link sp-nav-prev">
                                        <i class="fas fa-arrow-left" aria-hidden="true"></i>
                                        <span><?php echo esc_html( get_the_title( $prev_post ) ); ?></span>
                                    </a>
                                <?php endif; ?>
                                <?php if ( $next_post ) : ?>
                                    <a href="<?php echo esc_url( get_permalink( $next_post ) ); ?>"
                                       class="sp-nav-link sp-nav-next">
                                        <span><?php echo esc_html( get_the_title( $next_post ) ); ?></span>
                                        <i class="fas fa-arrow-right" aria-hidden="true"></i>
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endif; ?>

                </aside>

            </div>
        </div>
    </section>

    <!-- ============================================================
         Related projects — pmenu Swiper (same category)
    ============================================================ -->
    <?php if ( $primary_term ) :
        $related = new WP_Query( [
            'post_type'      => 'project',
            'posts_per_page' => 6,
            'post_status'    => 'publish',
            'post__not_in'   => [ get_the_ID() ],
            'orderby'        => 'rand',
            'tax_query'      => [ [
                'taxonomy' => 'category_project',
                'field'    => 'term_id',
                'terms'    => $primary_term->term_id,
            ] ],
        ] );

        if ( $related->have_posts() ) :
    ?>
    <section class="sp-related py-[5rem] bg-[#0d0d1a]">
        <div class="container mb-[3.2rem]">
            <h2 class="text-[2.6rem] font-bold text-white leading-[1.3]">
                Dự án liên quan
                <span class="text-[1.4rem] font-normal text-[#ef519e] ml-[1.2rem]">
                    — <?php echo esc_html( $primary_term->name ); ?>
                </span>
            </h2>
        </div>

        <div class="pmenu">
            <div class="pmenu-wrap">
                <div class="pmenu-slide pmenuSwiper">
                    <div class="swiper">
                        <div class="swiper-wrapper">
                            <?php while ( $related->have_posts() ) : $related->the_post();
                                $r_img = get_post_thumbnail_id()
                                    ? wp_get_attachment_image_url( get_post_thumbnail_id(), 'medium_large' )
                                    : '';
                            ?>
                            <div class="swiper-slide">
                                <div class="pmenu-item">
                                    <div class="pmenu-box">
                                        <div class="pmenu-box-img">
                                            <div class="pmenu-img scroll-element primary">
                                                <?php if ( $r_img ) : ?>
                                                    <img src="<?php echo esc_url( $r_img ); ?>"
                                                         alt="<?php the_title_attribute(); ?>"
                                                         loading="lazy">
                                                <?php else : ?>
                                                    <div style="width:100%;height:100%;background:#1a1a2e;"></div>
                                                <?php endif; ?>
                                            </div>
                                            <div class="pmenu-img scroll-element secondary" aria-hidden="true">
                                                <?php if ( $r_img ) : ?>
                                                    <img src="<?php echo esc_url( $r_img ); ?>" alt="" loading="lazy">
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                        <a class="pmenu-desc" href="<?php the_permalink(); ?>">
                                            <span class="title"><?php the_title(); ?></span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <?php endwhile; wp_reset_postdata(); ?>
                        </div>
                    </div>
                    <div class="pmenu-btn">
                        <div class="swiper-button-next pmenu-btn-next"><span class="txt">Next</span></div>
                        <div class="swiper-button-prev pmenu-btn-prev"><span class="txt">Prev</span></div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <?php
        endif;
    endif;
    ?>

</main>

<?php endwhile; ?>
<?php get_footer(); ?>
