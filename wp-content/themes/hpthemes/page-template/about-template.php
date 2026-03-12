<?php

/**
 * Template name: Giới thiệu
 * @author : HP.Media / Website
 */

hp_enqueue_page_assets( [
    'css' => [
        'swiper-css' => [ 'path' => 'public/library/swiper/swiper-bundle.min.css', 'priority' => 10 ],
        'about-css'  => [ 'path' => 'public/css/pages/about.css', 'deps' => [ 'hp-frontend' ] ],
    ],
    'js' => [
        'swiper' => [ 'path' => 'public/library/swiper/swiper-bundle.min.js', 'priority' => 10 ],
        'about'  => [ 'path' => 'public/scripts/pages/about.js', 'priority' => 10 ],
    ],
] );

get_header();

while ( have_posts() ) :
    the_post();

    /**
     * ACF Repeater: hp_about_slides
     * Sub-fields:
     *   - title   (Text)
     *   - content (Textarea / WYSIWYG)
     *   - image   (Image – return format: Image ID)
     */
    $slides = get_field( 'hp_about_slides' );
?>

<main class="main page-template">

    <?php if ( $slides ) : ?>

    <section class="ab">
        <div class="ab-wrap w-full overflow-hidden relative h-screen max-[650px]:h-auto">

            <!-- Swiper chính: hình ảnh (parallax, linked thumb) -->
            <div class="ab-slide accomSwiper w-3/5 relative h-screen max-[650px]:w-full max-[650px]:h-[50vh]">
                <div class="swiper h-full">
                    <div class="swiper-wrapper">

                        <?php foreach ( $slides as $slide ) :
                            $img_id = $slide['image'];
                        ?>
                        <div class="swiper-slide relative z-1 overflow-hidden">
                            <div class="ab-slide-item bnh-parallax h-full">
                                <div class="ab-img inner h-full w-full">
                                    <?php if ( $img_id ) :
                                        echo wp_get_attachment_image(
                                            $img_id,
                                            'full',
                                            false,
                                            [ 'alt' => esc_attr( $slide['title'] ), 'loading' => 'eager', 'class' => 'h-full w-full object-cover' ]
                                        );
                                    endif; ?>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>

                    </div>
                </div>
            </div>

            <!-- Swiper thumbnail: tiêu đề + nội dung (cube effect) -->
            <div class="ab-thumb accomThumbSwiper">
                <div class="swiper">
                    <div class="swiper-wrapper">

                        <?php foreach ( $slides as $slide ) : ?>
                        <div class="swiper-slide">
                            <div class="ab-thumb-ctn p-16 max-[768px]:p-12 relative h-full w-full">

                                <?php if ( ! empty( $slide['title'] ) ) : ?>
                                <h3 class="title">
                                    <?php echo esc_html( $slide['title'] ); ?>
                                </h3>
                                <?php endif; ?>

                                <?php if ( ! empty( $slide['content'] ) ) : ?>
                                <div class="txt">
                                    <?php echo wp_kses_post( $slide['content'] ); ?>
                                </div>
                                <?php endif; ?>

                            </div>
                        </div>
                        <?php endforeach; ?>

                    </div>

                    <div class="ab-thumb-btn">
                        <div class="swiper-button-next ab-thumb-btn-next"></div>
                        <div class="swiper-button-prev ab-thumb-btn-prev"></div>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <?php endif; ?>

</main>

<?php
endwhile;
get_footer();
