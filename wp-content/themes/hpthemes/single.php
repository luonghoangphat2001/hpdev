<?php

/**
 * The template for displaying single posts.
 *
 * @package HP.Media / Website
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();

while ( have_posts() ) :
    the_post();
    hp_set_post_view();

    $post_id   = get_the_ID();
    $tags      = wp_get_post_tags( $post_id );
    $terms     = get_the_terms( $post_id, 'category' );
    $ids       = [];

    if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) {
        foreach ( $terms as $term ) {
            $ids[] = $term->term_id;
        }
    }

    // Estimated reading time (~200 words/min)
    $word_count = str_word_count( wp_strip_all_tags( get_the_content() ) );
    $read_time  = max( 1, round( $word_count / 200 ) );

    // Prev / Next posts
    $prev_post = get_previous_post();
    $next_post = get_next_post();
?>

<main class="main" id="main-content">

<article itemscope itemtype="https://schema.org/Article">

    <!-- ======= Hero Image ======= -->
    <?php if ( has_post_thumbnail() ) : ?>
    <div class="relative h-[48vh] min-h-[28rem] max-h-[60rem] overflow-hidden">
        <?php the_post_thumbnail( 'full', [
            'class'    => 'w-full h-full object-cover object-center',
            'alt'      => esc_attr( get_the_title() ),
            'loading'  => 'eager',
            'itemprop' => 'image',
        ] ); ?>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent from-[30%] to-black/45"
             aria-hidden="true"></div>
    </div>
    <?php endif; ?>

    <div class="container">

        <!-- ======= Breadcrumb ======= -->
        <?php get_template_part( 'partials/breadcrumb' ); ?>

        <!-- ======= Main Grid: content + sidebar ======= -->
        <div class="grid grid-cols-[1fr_30rem] gap-[4rem] pt-[4rem] pb-[6rem] items-start max-[1024px]:grid-cols-1 max-[1024px]:gap-[3rem]">

            <!-- ===== Main Content ===== -->
            <div>

                <!-- Category badges -->
                <?php if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) : ?>
                <div class="flex flex-wrap gap-[0.8rem] mb-[1.6rem]">
                    <?php foreach ( $terms as $term ) : ?>
                    <a href="<?php echo esc_url( get_term_link( $term ) ); ?>"
                       class="inline-block py-[0.4rem] px-[1.2rem] bg-[#ef519e] text-white text-[1.2rem] font-semibold tracking-[0.06em] uppercase rounded-[0.4rem] transition-colors duration-[250ms] hover:bg-[#d93d8a]"
                       rel="category tag"
                       itemprop="articleSection">
                        <?php echo esc_html( $term->name ); ?>
                    </a>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <!-- Title -->
                <h1 class="text-[3.6rem] font-bold leading-[1.3] text-[#1a1a2e] mb-[2rem] max-[800px]:text-[2.6rem] max-[480px]:text-[2.2rem]"
                    itemprop="headline">
                    <?php the_title(); ?>
                </h1>

                <!-- Meta bar -->
                <div class="flex flex-wrap items-center gap-[1.2rem] text-[1.4rem] text-[#666] mb-[2.4rem] pb-[2rem] border-b border-[#f0f0f0]">

                    <address class="single-meta-author flex items-center gap-[0.6rem] not-italic"
                             itemprop="author"
                             itemscope
                             itemtype="https://schema.org/Person">
                        <i class="far fa-user" aria-hidden="true"></i>
                        <span itemprop="name"><?php echo esc_html( get_the_author() ); ?></span>
                    </address>

                    <span class="w-[0.4rem] h-[0.4rem] rounded-full bg-[#ccc] shrink-0" aria-hidden="true"></span>

                    <time class="single-meta-date flex items-center gap-[0.6rem]"
                          datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"
                          itemprop="datePublished">
                        <i class="far fa-calendar" aria-hidden="true"></i>
                        <?php echo get_the_date( 'd/m/Y' ); ?>
                    </time>

                    <span class="w-[0.4rem] h-[0.4rem] rounded-full bg-[#ccc] shrink-0" aria-hidden="true"></span>

                    <span class="single-meta-read flex items-center gap-[0.6rem]">
                        <i class="far fa-clock" aria-hidden="true"></i>
                        <?php echo esc_html( $read_time ); ?> phút đọc
                    </span>

                    <div class="ml-auto" aria-label="Chia sẻ">
                        <?php get_template_part( 'partials/social-share' ); ?>
                    </div>

                </div>

                <!-- Lead excerpt -->
                <?php $excerpt = get_the_excerpt(); if ( $excerpt ) : ?>
                <p class="text-[1.7rem] leading-[1.75] text-[#444] border-l-[0.4rem] border-l-[#ef519e] px-[2rem] py-[1.4rem] mb-[2.8rem] bg-[#fdf2f8] rounded-r-[0.6rem]"
                   itemprop="description">
                    <?php echo esc_html( $excerpt ); ?>
                </p>
                <?php endif; ?>

                <!-- Article body — keep .single-content for typography compound selectors in CSS -->
                <div class="single-content entry-content text-[1.6rem] leading-[1.85] text-[#333]"
                     itemprop="articleBody">
                    <?php the_content(); ?>
                </div>

                <!-- Tags -->
                <?php if ( ! empty( $tags ) ) : ?>
                <div class="flex flex-wrap items-center gap-[0.8rem] mt-[3.2rem] pt-[2.4rem] border-t border-[#f0f0f0]">
                    <span class="text-[1.4rem] text-[#888] font-semibold">
                        <i class="fas fa-tag" aria-hidden="true"></i> Tags:
                    </span>
                    <?php foreach ( $tags as $tag ) : ?>
                    <a href="<?php echo esc_url( get_term_link( $tag ) ); ?>"
                       class="py-[0.5rem] px-[1.4rem] border border-[#e5e7eb] rounded-full text-[1.3rem] text-[#555] transition duration-[250ms] hover:border-[#ef519e] hover:text-[#ef519e]"
                       rel="tag">
                        <?php echo esc_html( $tag->name ); ?>
                    </a>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <!-- Share (bottom) -->
                <div class="flex items-center gap-[1.2rem] mt-[2.4rem] text-[1.4rem] text-[#666] font-semibold">
                    <span>Chia sẻ:</span>
                    <?php get_template_part( 'partials/social-share' ); ?>
                </div>

                <!-- Author box — keep .single-author-box for avatar compound selector in CSS -->
                <div class="single-author-box flex gap-[2rem] items-start mt-[3.2rem] p-[2.4rem] border border-[#f0f0f0] rounded-[1.2rem] bg-[#fafafa] max-[480px]:flex-col max-[480px]:items-center max-[480px]:text-center">
                    <?php echo get_avatar( get_the_author_meta( 'ID' ), 80, '', '', [
                        'class' => 'single-author-avatar',
                    ] ); ?>
                    <div>
                        <p class="text-[1.2rem] text-[#ef519e] font-bold uppercase tracking-[0.1em] mb-[0.4rem]">
                            <?php esc_html_e( 'Tác giả', 'hp-admin' ); ?>
                        </p>
                        <h3 class="text-[1.8rem] font-bold text-[#1a1a2e] mb-[0.8rem]">
                            <?php echo esc_html( get_the_author() ); ?>
                        </h3>
                        <?php $bio = get_the_author_meta( 'description' ); if ( $bio ) : ?>
                        <p class="text-[1.4rem] text-[#666] leading-[1.6] m-0">
                            <?php echo esc_html( $bio ); ?>
                        </p>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Prev / Next navigation -->
                <?php if ( $prev_post || $next_post ) : ?>
                <nav class="grid grid-cols-2 gap-[1.6rem] mt-[3.2rem] pt-[2.4rem] border-t border-[#f0f0f0] max-[600px]:grid-cols-1"
                     aria-label="Điều hướng bài viết">

                    <?php if ( $prev_post ) : ?>
                    <a href="<?php echo esc_url( get_permalink( $prev_post ) ); ?>"
                       class="flex flex-col gap-[0.8rem] p-[1.8rem] border border-[#f0f0f0] rounded-[1rem] transition duration-[250ms] hover:border-[#ef519e] hover:bg-[#fdf2f8]"
                       rel="prev">
                        <span class="single-nav-dir flex items-center gap-[0.6rem] text-[1.2rem] text-[#ef519e] font-bold uppercase tracking-[0.08em]">
                            <i class="fas fa-arrow-left" aria-hidden="true"></i>
                            Bài trước
                        </span>
                        <?php if ( has_post_thumbnail( $prev_post ) ) :
                            echo get_the_post_thumbnail( $prev_post, 'thumbnail', [ 'class' => 'w-full h-[8rem] object-cover rounded-[0.6rem]', 'alt' => '', 'loading' => 'lazy' ] );
                        endif; ?>
                        <span class="text-[1.4rem] font-semibold text-[#333] leading-[1.4] line-clamp-2">
                            <?php echo esc_html( get_the_title( $prev_post ) ); ?>
                        </span>
                    </a>
                    <?php endif; ?>

                    <?php if ( $next_post ) : ?>
                    <a href="<?php echo esc_url( get_permalink( $next_post ) ); ?>"
                       class="flex flex-col gap-[0.8rem] p-[1.8rem] border border-[#f0f0f0] rounded-[1rem] transition duration-[250ms] text-right hover:border-[#ef519e] hover:bg-[#fdf2f8]"
                       rel="next">
                        <span class="single-nav-dir flex items-center justify-end gap-[0.6rem] text-[1.2rem] text-[#ef519e] font-bold uppercase tracking-[0.08em]">
                            Bài tiếp
                            <i class="fas fa-arrow-right" aria-hidden="true"></i>
                        </span>
                        <?php if ( has_post_thumbnail( $next_post ) ) :
                            echo get_the_post_thumbnail( $next_post, 'thumbnail', [ 'class' => 'w-full h-[8rem] object-cover rounded-[0.6rem]', 'alt' => '', 'loading' => 'lazy' ] );
                        endif; ?>
                        <span class="text-[1.4rem] font-semibold text-[#333] leading-[1.4] line-clamp-2">
                            <?php echo esc_html( get_the_title( $next_post ) ); ?>
                        </span>
                    </a>
                    <?php endif; ?>

                </nav>
                <?php endif; ?>

            </div><!-- main content -->

            <!-- ===== Sidebar ===== -->
            <aside class="sticky top-[calc(var(--size-hd)+2rem)] self-start flex flex-col gap-[2.4rem] max-[1024px]:static"
                   aria-label="Sidebar bài viết">

                <?php if ( has_term( 'tuyen-dung', 'category' ) ) : ?>

                    <div class="border border-[#f0f0f0] rounded-[1.2rem] p-[2rem] bg-white">
                        <?php echo do_shortcode( '[contact-form-7 id="1109ff5" title="Tuyển dụng vị trí"]' ); ?>
                    </div>

                <?php else : ?>

                    <!-- Recent posts -->
                    <?php
                    $latest = new WP_Query( [
                        'post_type'      => 'post',
                        'post_status'    => 'publish',
                        'posts_per_page' => 4,
                        'post__not_in'   => [ $post_id ],
                    ] );
                    if ( $latest->have_posts() ) :
                    ?>
                    <div class="border border-[#f0f0f0] rounded-[1.2rem] p-[2rem] bg-white">
                        <h2 class="text-[1.7rem] font-bold text-[#1a1a2e] mb-[1.8rem] pb-[1.2rem] border-b-2 border-[#ef519e]">
                            <?php esc_html_e( 'Bài viết mới nhất', 'hp-admin' ); ?>
                        </h2>
                        <ul class="list-none flex flex-col gap-[1.6rem]">
                            <?php while ( $latest->have_posts() ) : $latest->the_post(); ?>
                            <li class="flex gap-[1.2rem] items-start">
                                <?php if ( has_post_thumbnail() ) : ?>
                                <a href="<?php the_permalink(); ?>"
                                   class="sidebar-post-thumb shrink-0 w-[7.2rem] h-[5.4rem] overflow-hidden rounded-[0.6rem] block"
                                   tabindex="-1"
                                   aria-hidden="true">
                                    <?php the_post_thumbnail( 'thumbnail', [
                                        'alt'     => '',
                                        'loading' => 'lazy',
                                    ] ); ?>
                                </a>
                                <?php endif; ?>
                                <div class="flex-1 min-w-0">
                                    <a href="<?php the_permalink(); ?>"
                                       class="block text-[1.4rem] font-semibold text-[#333] leading-[1.45] line-clamp-2 transition-colors duration-200 mb-[0.4rem] hover:text-[#ef519e]">
                                        <?php the_title(); ?>
                                    </a>
                                    <time class="block text-[1.2rem] text-[#aaa]"
                                          datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
                                        <?php echo get_the_date( 'd/m/Y' ); ?>
                                    </time>
                                </div>
                            </li>
                            <?php endwhile; wp_reset_postdata(); ?>
                        </ul>
                    </div>
                    <?php endif; ?>

                <?php endif; ?>

                <!-- Tags widget -->
                <?php if ( ! empty( $tags ) ) : ?>
                <div class="border border-[#f0f0f0] rounded-[1.2rem] p-[2rem] bg-white">
                    <h2 class="text-[1.7rem] font-bold text-[#1a1a2e] mb-[1.8rem] pb-[1.2rem] border-b-2 border-[#ef519e]">
                        <?php esc_html_e( 'Chủ đề', 'hp-admin' ); ?>
                    </h2>
                    <div class="flex flex-wrap gap-[0.8rem]">
                        <?php foreach ( $tags as $tag ) : ?>
                        <a href="<?php echo esc_url( get_term_link( $tag ) ); ?>"
                           class="py-[0.5rem] px-[1.2rem] border border-[#e5e7eb] rounded-full text-[1.3rem] text-[#555] transition duration-[250ms] hover:border-[#ef519e] hover:text-[#ef519e]"
                           rel="tag">
                            <?php echo esc_html( $tag->name ); ?>
                        </a>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>

            </aside><!-- sidebar -->

        </div><!-- grid -->

    </div><!-- .container -->

</article>

<!-- ======= Related Posts ======= -->
<?php if ( ! empty( $ids ) ) :
    $related = new WP_Query( [
        'post_type'      => 'post',
        'post_status'    => 'publish',
        'posts_per_page' => 4,
        'category__in'   => $ids,
        'post__not_in'   => [ $post_id ],
        'orderby'        => 'rand',
    ] );
    if ( $related->have_posts() ) :
?>
<section class="py-[5rem] bg-[#f9fafb]" aria-labelledby="related-heading">
    <div class="container">
        <h2 class="section-title text-[2.6rem] font-bold text-[#1a1a2e] mb-[3rem] pb-[1.4rem] relative"
            id="related-heading">
            <?php esc_html_e( 'Bài viết liên quan', 'hp-admin' ); ?>
        </h2>
        <div class="grid grid-cols-4 gap-[2.4rem] max-[1024px]:grid-cols-2 max-[560px]:grid-cols-1">
            <?php while ( $related->have_posts() ) : $related->the_post(); ?>
                <?php get_template_part( 'partials/loop/blog' ); ?>
            <?php endwhile; wp_reset_postdata(); ?>
        </div>
    </div>
</section>
<?php endif; endif; ?>

<!-- ======= Featured Products ======= -->
<?php if ( class_exists( 'WooCommerce' ) ) :
    $products = new WP_Query( [
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => 4,
    ] );
    if ( $products->have_posts() ) :
?>
<section class="py-[5rem]" aria-labelledby="products-heading">
    <div class="container">
        <h2 class="section-title text-[2.6rem] font-bold text-[#1a1a2e] mb-[3rem] pb-[1.4rem] relative"
            id="products-heading">
            <?php esc_html_e( 'Sản phẩm nổi bật', 'hp-admin' ); ?>
        </h2>
        <div class="grid grid-cols-4 gap-[2.4rem] max-[1024px]:grid-cols-2">
            <?php while ( $products->have_posts() ) : $products->the_post(); ?>
                <div><?php call_user_func( 'wc_get_template_part', 'content', 'product' ); ?></div>
            <?php endwhile; wp_reset_postdata(); ?>
        </div>
    </div>
</section>
<?php endif; endif; ?>

</main>

<?php
endwhile;
get_footer();
