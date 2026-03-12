<div id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
    <div class="post__header">
        <h2 class="post__title">
            <a href="<?php the_permalink() ?>" rel="bookmark"><?php the_title() ?></a>
        </h2>
    </div>
    <div class="post__content">
        <?php the_excerpt() ?>
    </div>
</div><!-- #post-## -->