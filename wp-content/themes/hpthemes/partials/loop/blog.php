<?php
$link  = get_the_permalink();
$terms = get_the_terms( get_the_ID(), 'category' );
?>
<article class="blog-card group flex flex-col bg-white rounded-[1.2rem] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-shadow duration-300 hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)]">

    <a class="blog-thumb block relative overflow-hidden aspect-[16/10] flex-shrink-0"
       href="<?php echo esc_url( $link ); ?>"
       tabindex="-1" aria-hidden="true">
        <?php
        if ( has_post_thumbnail() ) {
            the_post_thumbnail( 'medium_large', [
                'class'   => 'w-full h-full object-cover object-center transition-transform duration-[400ms] group-hover:scale-[1.06]',
                'alt'     => the_title_attribute( [ 'echo' => false ] ),
                'loading' => 'lazy',
            ] );
        } else {
            echo '<div class="w-full h-full bg-[#f3f3f3] flex items-center justify-center text-[#ccc]"><i class="far fa-image text-[3rem]"></i></div>';
        }
        ?>
    </a>

    <div class="flex flex-col flex-1 p-[1.8rem] gap-[1rem]">

        <?php if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) : ?>
            <div class="flex flex-wrap gap-[0.6rem]">
                <?php foreach ( $terms as $term ) : ?>
                    <a href="<?php echo esc_url( get_term_link( $term ) ); ?>"
                       class="inline-block text-[1.15rem] font-semibold uppercase tracking-[0.05em] text-[#ef519e] leading-[1]
                              border border-[#ef519e] rounded-[0.4rem] px-[0.8rem] py-[0.35rem]
                              transition-colors duration-200 hover:bg-[#ef519e] hover:text-white">
                        <?php echo esc_html( $term->name ); ?>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <h3 class="text-[1.7rem] font-bold leading-[1.45] text-[#1a1a2e] line-clamp-2 mt-[0.2rem]">
            <a href="<?php echo esc_url( $link ); ?>"
               class="transition-colors duration-200 hover:text-[#ef519e]">
                <?php the_title(); ?>
            </a>
        </h3>

        <?php if ( has_excerpt() ) : ?>
            <p class="text-[1.4rem] text-[#666] leading-[1.6] line-clamp-2">
                <?php echo esc_html( get_the_excerpt() ); ?>
            </p>
        <?php endif; ?>

        <div class="flex items-center gap-[1.4rem] mt-auto pt-[1.2rem] border-t border-[#f3f3f3] text-[1.3rem] text-[#888]">
            <span class="flex items-center gap-[0.5rem]">
                <i class="far fa-user text-[#ef519e]" aria-hidden="true"></i>
                <?php echo esc_html( get_the_author() ); ?>
            </span>
            <span class="flex items-center gap-[0.5rem]">
                <i class="far fa-calendar text-[#ef519e]" aria-hidden="true"></i>
                <time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>">
                    <?php echo esc_html( get_the_date( 'd/m/Y' ) ); ?>
                </time>
            </span>
        </div>

    </div>
</article>
