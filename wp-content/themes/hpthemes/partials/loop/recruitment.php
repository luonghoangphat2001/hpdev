<?php
$postID = get_the_ID();
$terms = get_the_terms($postID, 'category_recruitment');
$hp_recruitment_repeater = get_field('hp_recruitment_repeater', $postID); ?>
<div class="care-item">
    <div class="care-in">
        <div class="care-gr">
            <div class="care-avt">
                <?php echo get_the_post_thumbnail() ?>
            </div>
            <div class="care-ctn">
                <a class="t-link" href="<?php echo get_the_permalink() ?>">
                    <?php echo get_the_title() ?>
                </a>
                <span class="t-type">
                    <?php
                    if (!empty($terms)) {
                        foreach ($terms as $key => $item) {
                            echo $item->name;
                            echo $key - 1 < 0 ? ', ' : '';
                        }
                    } ?>
                </span>
                <div class="care-ul">
                    <?php
                    if (!empty($hp_recruitment_repeater)) {
                        foreach ($hp_recruitment_repeater as $key => $item) { ?>
                            <div class="care-li">
                                <span class="t-text">
                                    <?php echo $item['content'] ?>
                                </span>
                            </div>
                    <?php }
                    } ?>
                </div>
            </div>
        </div>
    </div>
</div>