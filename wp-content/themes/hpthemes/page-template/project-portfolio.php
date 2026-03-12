<?php

/**
 * Template name: Project Portfolio
 * @author : HP.Media / Website
 *
 * Layout: khong-gian.html — 3D Curtain Scroll
 *   Section 1 → Hero: featured image + page title
 *   Section 2-N → Mỗi danh mục (category_project): ảnh trái / text phải
 *
 * Flow:
 *   project-portfolio (danh mục) → taxonomy-category_project (dự án) → single-project
 */

hp_enqueue_page_assets( [
    'js' => [
        'scroll-section' => [ 'path' => 'public/scripts/ScrollSectionModule.js', 'deps' => [ 'jquery' ], 'priority' => 10 ],
    ],
    'css' => [
        'project-css' => [ 'path' => 'public/css/pages/project.css', 'deps' => [ 'hp-frontend' ] ],
    ],
] );

get_header();

// Query danh mục category_project
$categories = get_terms( [
    'taxonomy'   => 'category_project',
    'hide_empty' => false,
    'parent'     => 0,
    'orderby'    => 'term_order',
    'order'      => 'ASC',
] );
?>

<main class="main page-template">

    <?php /* ---- Hero section: page title + featured image ---- */ ?>
    <?php while ( have_posts() ) : the_post(); ?>
    <section class="cd-section">
        <div class="cd-block">
            <?php if ( has_post_thumbnail() ) : ?>
            <div class="kg-bg">
                <?php the_post_thumbnail( 'full', [ 'alt' => esc_attr( get_the_title() ) ] ); ?>
            </div>
            <?php endif; ?>
            <h1><?php the_title(); ?></h1>
        </div>
    </section>
    <?php endwhile; ?>

    <?php if ( ! empty( $categories ) && ! is_wp_error( $categories ) ) : ?>

        <?php foreach ( $categories as $index => $cat ) :

            // Ảnh đại diện danh mục:
            // 1) Term meta thumbnail (set via ACF taxonomy field hoặc custom meta)
            // 2) Fallback: ảnh featured của project đầu tiên trong danh mục
            $thumb_id = get_term_meta( $cat->term_id, 'category_project_thumbnail_id', true );

            if ( ! $thumb_id ) {
                $first_project = get_posts( [
                    'post_type'      => 'project',
                    'posts_per_page' => 1,
                    'post_status'    => 'publish',
                    'tax_query'      => [ [
                        'taxonomy' => 'category_project',
                        'field'    => 'term_id',
                        'terms'    => $cat->term_id,
                    ] ],
                ] );
                if ( ! empty( $first_project ) ) {
                    $thumb_id = get_post_thumbnail_id( $first_project[0]->ID );
                }
            }

            $cat_link = get_term_link( $cat );
        ?>
        <section class="cd-section">
            <div class="cd-block">

                <div class="cd-half-block curtain-section-image">
                    <?php if ( $thumb_id ) : ?>
                        <?php echo wp_get_attachment_image( $thumb_id, 'large', false, [
                            'alt'     => esc_attr( $cat->name ),
                            'loading' => 'lazy',
                        ] ); ?>
                    <?php else : ?>
                        <div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e,#2d2d5e);"></div>
                    <?php endif; ?>
                </div>

                <div class="cd-half-block curtain-section-text flex items-center">
                    <div class="kg-ctn">
                        <h2 class="title"><?php echo esc_html( $cat->name ); ?></h2>
                        <?php if ( ! empty( $cat->description ) ) : ?>
                            <div class="txt">
                                <p><?php echo esc_html( $cat->description ); ?></p>
                            </div>
                        <?php endif; ?>
                        <?php if ( $cat->count > 0 ) : ?>
                            <p class="txt" style="font-size:1.4rem;color:#888;margin-bottom:2rem;">
                                <?php echo esc_html( $cat->count ); ?> dự án
                            </p>
                        <?php endif; ?>
                        <a class="btn btn-pri" href="<?php echo esc_url( $cat_link ); ?>">
                            <span class="text"><?php esc_html_e( 'Xem dự án', 'hp-admin' ); ?></span>
                        </a>
                    </div>
                </div>

            </div>
        </section>
        <?php endforeach; ?>

    <?php else : ?>

        <section class="cd-section">
            <div class="cd-block">
                <div class="cd-half-block curtain-section-text">
                    <div class="kg-ctn">
                        <h2 class="title"><?php esc_html_e( 'Chưa có danh mục nào.', 'hp-admin' ); ?></h2>
                    </div>
                </div>
            </div>
        </section>

    <?php endif; ?>

    <!-- Vertical navigation (curtain scroll) -->
    <nav>
        <ul class="cd-vertical-nav">
            <li>
                <a class="cd-prev inactive" href="#0">
                    <i class="fas fa-chevron-down" aria-hidden="true"></i>
                </a>
            </li>
            <li>
                <a class="cd-next" href="#0">
                    <i class="fas fa-chevron-down" aria-hidden="true"></i>
                </a>
            </li>
        </ul>
    </nav>

</main>

<?php get_footer(); ?>
