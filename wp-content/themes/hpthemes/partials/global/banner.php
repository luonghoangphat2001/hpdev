<?php
// if (is_tax() || is_category() || is_tag()) {
//     $page = HP_WC_PRODUCTS;
//     $ob = get_queried_object();
//     $tt = $ob->name;
// } elseif (is_home()) {
//     $page = HP_PAGE_BLOG;
//     $tt = get_the_title(HP_PAGE_BLOG);
// } elseif (is_search()) {
//     $page = HP_WC_PRODUCTS;
//     $tt =  woocommerce_page_title(false);
// } elseif (is_singular()) {
//     $page = '';
//     $tt = get_the_title();
// } elseif (is_shop()) {
//     $page = HP_WC_PRODUCTS;
//     $tt = get_the_title(HP_WC_PRODUCTS);
// } else {
//     $page = '';
//     $tt =  woocommerce_page_title(false);
// }
// $bn = get_field('hp_global_bn', $page);
// if (empty($bn)) {
//     $page = HP_WC_PRODUCTS;
//     $bn = get_field('hp_global_bn', $page);
// }
?>
<div class="bnp">
    <div class="container">
        <div class="bnp-wrap">
            <div class="bnp-image">
                <div class="inner">
                    <?php echo wp_get_attachment_image($bn, 'full') ?>
                </div>
            </div>
            <div class="bnp-ctn">
                <h1 class="bnp-title" data-aos="fade-left">
                    <?php echo $tt ?>
                </h1>
                <?php get_template_part('partials/breadcrumb') ?>
            </div>
        </div>
    </div>
</div>