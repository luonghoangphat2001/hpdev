<?php $link = get_the_permalink();
$terms = get_the_terms(get_the_ID(), 'category') ?>
<div class="news-item row">
    <div class="news-image col col-6 col-md-3">
        <div class="inner-img">
            <a class="inner" href="<?php echo $link ?>">
                <?php echo get_the_post_thumbnail() ?>
            </a>
        </div>
    </div>
    <div class="news-ctn col col-6 col-md-9">
        <div class="news-bl">
            <div class="news-content">
                <?php if (!empty($terms)) { ?>
                    <div class="t-tags">
                        <?php foreach ($terms as $key => $term) { ?>
                            <a class="t-tag" href="<?php echo get_term_link($term) ?>">
                                <?php echo $term->name ?>
                            </a>
                        <?php } ?>
                    </div>
                <?php } ?>
                <h3 class="news-tt">
                    <a class="t-link" href="<?php echo $link ?>">
                        <?php echo get_the_title() ?>
                    </a>
                </h3>
                <div class="t-gr">
                    <span class="t-text">
                        <?php echo get_the_author() ?>
                    </span>
                    <span class="t-text">
                        <?php echo get_the_date('d/m/Y') ?>
                    </span>
                </div>
            </div>
        </div>
    </div>
</div>