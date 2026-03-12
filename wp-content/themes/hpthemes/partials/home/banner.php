<?php

/**
 * Section name: Home Banners
 * Description: 
 * Author: HPmedia
 * Order: 1
 */
$hp_banner_repeater = get_field('hp_banner_repeater')
?>
<?php if (!empty($hp_banner_repeater)) { ?>
    <div class="hban">
        <div class="hban-wrap">
            <div class="hban-slide hbanSwiper">
                <div class="swiper">
                    <div class="swiper-wrapper">
                        <?php foreach ($hp_banner_repeater as $key => $value) {
                        ?>
                            <div class="swiper-slide">
                                <div class="hban-img">
                                    <?php echo wp_get_attachment_image($value['images'], 'full') ?>
                                </div>
                            </div>
                        <?php  } ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
<?php
}
?>