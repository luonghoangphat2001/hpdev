<?php

/**
 * Section name: Home Product Summer
 * Description: 
 * Author: HPmedia
 * Order: 4
 */

$hp_product_repeater = get_field('hp_product_repeater');
?>
<?php if (!empty($hp_product_repeater)) {

    foreach ($hp_product_repeater as $key => $value) {

        if ($value['select'] == '2') {
            $postype = 'post';
        } else {
            $postype = 'product';
        }


        $args = array(
            'post_type' =>  $postype,
            'post_status' => 'publish',
            'post__in' => $value['relationship'],
            'ignore_sticky_posts' => 1,
            'orderby' => 'post__in',
            'order' => 'DESC',
        );
        $list_posts = new WP_Query($args);
        if ($list_posts->have_posts()) {

?>
            <div class="hpro sec-pd">
                <div class="hpro-wrap">
                    <div class="container">
                        <div class="hpro-inner">
                            <h2 class="title-40">
                                <?php echo $value['title'] ?>
                            </h2>
                            <div class="hpro-slide hproSwiper mt-50">
                                <div class="swiper">
                                    <div class="swiper-wrapper">
                                        <?php
                                        while ($list_posts->have_posts()) {
                                            $list_posts->the_post();
                                        ?>
                                            <div class="swiper-slide">
                                                <?php
                                                if ($value['select'] == 2) {
                                                    echo get_template_part('partials/loop/blog');
                                                } else {
                                                    do_action('woocommerce_shop_loop');
                                                    wc_get_template_part('content', 'product');
                                                }
                                                ?>
                                            </div>
                                        <?php }
                                        wp_reset_postdata($list_posts)
                                        ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
<?php
        }
    }
}
?>