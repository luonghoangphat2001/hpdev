<?php

/**
 * Template name: Liên hệ
 * @author : HP.Media / Website
 */

hp_enqueue_page_assets( [
    'css' => [
        'contact-css' => [ 'path' => 'public/css/pages/contact.css', 'deps' => [ 'hp-frontend' ] ],
    ],
], 25 );

get_header();

while ( have_posts() ) :
    the_post();

    /**
     * ACF fields:
     *  mona_info   – repeater: images (ID), title, content, link
     *  mona_socail – repeater: icon (ID), link
     *  mona_form   – group:    title, content, form (shortcode)
     *  mona_map    – text/textarea: Google Maps embed code
     */
    $mona_info   = get_field( 'mona_info' );
    $mona_socail = get_field( 'mona_socail' );
    $mona_form   = get_field( 'mona_form' );
    $mona_map    = get_field( 'mona_map' );
?>

<main class="w-full">

    <?php get_template_part( 'partials/breadcrumb' ); ?>

    <!-- ============================================================
         Contact — info + form
    ============================================================ -->
    <section class="py-[6rem] max-[768px]:py-[4rem]">
        <div class="container">

            <div class="grid grid-cols-[5fr_7fr] gap-[5rem] items-start max-[900px]:grid-cols-1 max-[900px]:gap-[4rem]">

                <!-- ---- Left: Info column ---- -->
                <div class="flex flex-col gap-[3.6rem]">

                    <div>
                        <h2 class="contact-section-title text-[3rem] font-bold text-[#1a1a2e] leading-[1.3] pb-[1.6rem] mb-[1.4rem] relative max-[768px]:text-[2.4rem]">
                            Thông tin liên hệ
                        </h2>
                        <p class="text-[1.5rem] text-[#666] leading-[1.75]">
                            Hãy liên hệ với chúng tôi nếu bạn cần hỗ trợ — đội ngũ sẽ phản hồi trong thời gian sớm nhất.
                        </p>
                    </div>

                    <?php if ( ! empty( $mona_info ) ) : ?>
                        <ul class="flex flex-col gap-[1.6rem] list-none">
                            <?php foreach ( $mona_info as $item ) :
                                $has_link = ! empty( $item['link'] );
                                $tag      = $has_link ? 'a' : 'div';
                                $attr     = $has_link
                                    ? 'href="' . esc_url( $item['link'] ) . '" class="contact-info-card group flex items-start gap-[1.6rem] p-[2rem] rounded-[1.2rem] bg-white border border-[#f0f0f0] shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-[#ef519e] hover:shadow-[0_4px_20px_rgba(239,81,158,0.12)]"'
                                    : 'class="contact-info-card group flex items-start gap-[1.6rem] p-[2rem] rounded-[1.2rem] bg-white border border-[#f0f0f0] shadow-[0_2px_10px_rgba(0,0,0,0.05)]"';
                            ?>
                                <li>
                                    <<?php echo $tag; ?> <?php echo $attr; ?>>

                                        <?php if ( ! empty( $item['images'] ) ) : ?>
                                            <span class="flex-shrink-0 w-[4.8rem] h-[4.8rem] rounded-[1rem] bg-[#fdf2f8] flex items-center justify-center transition-colors duration-300 group-hover:bg-[#ef519e]">
                                                <?php echo wp_get_attachment_image( $item['images'], 'full', false, [
                                                    'class' => 'w-[2.4rem] h-[2.4rem] object-contain contact-info-icon',
                                                ] ); ?>
                                            </span>
                                        <?php endif; ?>

                                        <div class="flex flex-col gap-[0.4rem] min-w-0">
                                            <?php if ( ! empty( $item['title'] ) ) : ?>
                                                <span class="text-[1.3rem] font-semibold uppercase tracking-[0.05em] text-[#ef519e]">
                                                    <?php echo esc_html( $item['title'] ); ?>
                                                </span>
                                            <?php endif; ?>
                                            <?php if ( ! empty( $item['content'] ) ) : ?>
                                                <span class="text-[1.5rem] font-medium text-[#1a1a2e] leading-[1.5]">
                                                    <?php echo esc_html( $item['content'] ); ?>
                                                </span>
                                            <?php endif; ?>
                                        </div>

                                    </<?php echo $tag; ?>>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>

                    <?php if ( ! empty( $mona_socail ) ) : ?>
                        <div class="flex flex-col gap-[1.2rem]">
                            <span class="text-[1.3rem] font-semibold uppercase tracking-[0.06em] text-[#888]">
                                Mạng xã hội
                            </span>
                            <div class="flex flex-wrap gap-[1rem]">
                                <?php foreach ( $mona_socail as $social ) : ?>
                                    <a href="<?php echo esc_url( $social['link'] ); ?>"
                                       target="_blank" rel="noopener noreferrer"
                                       class="w-[4rem] h-[4rem] rounded-[0.8rem] border border-[#e5e7eb] flex items-center justify-center transition-all duration-200 hover:border-[#ef519e] hover:bg-[#fdf2f8]">
                                        <?php echo wp_get_attachment_image( $social['icon'], 'full', false, [
                                            'class' => 'w-[2rem] h-[2rem] object-contain',
                                        ] ); ?>
                                    </a>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>

                </div>

                <!-- ---- Right: Form column ---- -->
                <?php if ( ! empty( $mona_form ) && content_exists( $mona_form ) ) : ?>
                    <div class="bg-white rounded-[1.6rem] border border-[#f0f0f0] shadow-[0_4px_30px_rgba(0,0,0,0.08)] p-[3.6rem] max-[480px]:p-[2.4rem]">

                        <?php if ( ! empty( $mona_form['title'] ) ) : ?>
                            <h3 class="text-[2.4rem] font-bold text-[#1a1a2e] leading-[1.3] mb-[0.8rem]">
                                <?php echo esc_html( $mona_form['title'] ); ?>
                            </h3>
                        <?php endif; ?>

                        <?php if ( ! empty( $mona_form['content'] ) ) : ?>
                            <p class="text-[1.4rem] text-[#888] leading-[1.6] mb-[2.8rem]">
                                <?php echo esc_html( $mona_form['content'] ); ?>
                            </p>
                        <?php endif; ?>

                        <?php if ( ! empty( $mona_form['form'] ) ) : ?>
                            <div class="ct-form-in">
                                <?php echo do_shortcode( $mona_form['form'] ); ?>
                            </div>
                        <?php endif; ?>

                    </div>
                <?php endif; ?>

            </div>

        </div>
    </section>

    <!-- ============================================================
         Google Map — full width
    ============================================================ -->
    <?php if ( ! empty( $mona_map ) ) : ?>
        <div class="contact-map w-full overflow-hidden border-t border-[#f0f0f0]">
            <?php echo $mona_map; ?>
        </div>
    <?php endif; ?>

</main>

<?php
endwhile;
get_footer();
