<?php

/**
 * Section name: Home Category 1
 * Description: 
 * Author: HPmedia
 * Order: 5
 */
$hp_category_1 = get_field('hp_category_1')
?>
<?php if (empty($hp_category_1)) { ?>
    <div class="cate ">
        <div class="cate-wrapper">
            <div class="cate-head">
                <div class="cate-btn in">
                    <div class="cate-btn-inner">
                        <img src="<?php echo HP_THEME_PATH ?>/public/images/icon-cate.svg" alt="">
                    </div>
                </div>
                <div class="cate-head-text">
                    <a href="#" class="text"> Tìm kiếm sản phẩm</a>
                </div>
            </div>
            <div class="cate-body">
                <?php echo get_template_part('woocommerce/global/sidebar') ?>
            </div>
        </div>
    </div>

    <section class="hcol sec-pd">
        <div class="container">
            <div class="hcol-wrap hpro-inner">
                <h2 class="title-40">
                    Danh mục sản phẩm
                </h2>
                <div class="mt-50 hpro-category">
                    <div class="row ">
                        <?php foreach ($hp_category_1 as $value) {
                            $terms = get_term($value, 'product_cat');
                            $thumbnail_id = get_term_meta($value, 'thumbnail_id', true);
                        ?>

                            <div class="col-3">
                                <div class="hcol-item">
                                    <a href="<?php echo esc_url(get_term_link($value)) ?>" class="hcol-box">
                                        <div class="hcol-img">
                                            <?php echo mona_set_thumbnail_default($thumbnail_id) ?>
                                        </div>
                                        <div class="hcol-desc">
                                            <div class="hcol-name"><?php echo $terms->name ?></div>
                                        </div>
                                    </a>
                                </div>
                            </div>

                        <?php } ?>
                    </div>
                </div>
            </div>
        </div>
    </section>

<?php } ?>