<?php

/**
 * Section name: Home Đối tác
 * Description: 
 * Author: HPmedia
 * Order: 5
 */

$hp_product_album = get_field('hp_product_album');
$mona_home_doitact_title = get_field('mona_home_doitact_title');

if (!empty($hp_product_album)) {
?>
    <div class="hpro sec-pd doitact">
        <div class="hpro-wrap">
            <div class="container">
                <div class="hpro-inner">
                    <h2 class="title-40">
                        <?php echo $mona_home_doitact_title ?>
                    </h2>
                    <div class="hpro-slide hproSwiper mt-50">
                        <div class="swiper">
                            <div class="swiper-wrapper">
                                <?php foreach ($hp_product_album as $key => $value) { ?>
                                    <div class="swiper-slide">
                                        <div class="inner-img">
                                            <?php echo wp_get_attachment_image($value, 'full') ?>
                                        </div>
                                    </div>
                                <?php } ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
<?php


}
?>