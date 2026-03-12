<?php

/**
 * Section name: Home Product 
 * Description: 
 * Author: HPmedia
 * Order: 3
 */

$mona_home_sbnb = get_field('mona_home_sbnb');
if (content_exists($mona_home_sbnb)) {
?>
    <div class="hpro sec-pd sanphamnoitbat">
        <div class="hpro-wrap ">
            <div class="container">
                <div class="hpro-inner tabJS ">
                    <h2 class="title-40 t-center">
                        <span>
                            <?php echo $mona_home_sbnb['title'] ?>
                        </span>
                    </h2>
                    <div class="tab-btn-list">
                        <?php foreach ($mona_home_sbnb['repeater'] as $key => $value) {
                            $count =  count($value['relationship']); ?>
                            <div class="tabBtn">
                                <span class="btn while tab">
                                    <?php echo $value['title'] . ' (' . $count . ')' ?>
                                </span>
                            </div>
                        <?php } ?>
                    </div>
                    <div class="tab-panel-list">
                        <?php foreach ($mona_home_sbnb['repeater'] as $key => $value) {
                            $args = array(
                                'post_type' =>  'product',
                                'post_status' => 'publish',
                                'post__in' => $value['relationship'],

                            );
                            $list_posts = new WP_Query($args);
                            if ($list_posts->have_posts()) {
                        ?>
                                <div class="tabPanel">
                                    <div class="hpro-slide hproSwiper">
                                        <div class="row">

                                            <?php
                                            while ($list_posts->have_posts()) {
                                                $list_posts->the_post();
                                            ?>
                                                <div class="col col-6">
                                                    <?php

                                                    do_action('woocommerce_shop_loop');
                                                    wc_get_template_part('content', 'product');

                                                    ?>
                                                </div>
                                            <?php }
                                            wp_reset_postdata($list_posts)
                                            ?>

                                        </div>
                                    </div>
                                    <a class="btn-xth" href="<?php echo $value['link'] ?>">
                                        <?php echo $value['btn'] ?>
                                    </a>
                                </div>
                        <?php  }
                        } ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
<?php

}
