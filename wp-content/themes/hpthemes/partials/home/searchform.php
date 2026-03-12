<?php

/**
 * Section name: Home Search 
 * Description: 
 * Author: HPmedia
 * Order: 2
 */



$address = get_terms(
    array(
        'taxonomy' => 'category_address',
        'hide_empty' => true,
    )
);
$dt = get_terms(
    array(
        'taxonomy' => 'pa_dien-tich',
        'hide_empty' => true,
    )
);
$hp_category_2 = get_field('hp_category_2');
$hp_search_background = get_field('hp_search_background');
?>

<div class="hpro sec-pd home-search" style="background-image:url(<?php echo $hp_search_background ?>)">
    <div class="hpro-wrap">
        <div class="container">
            <div class="hpro-inner">


                <div class="hpro-inner tabJS ">

                    <div class="tab-btn-list">


                        <?php if (!empty($hp_category_2)) { ?>
                            <?php foreach ($hp_category_2 as $key => $value) { ?>
                                <div class="tabBtn">
                                    <span class="btn while tab">
                                        <?php echo $value->name ?>
                                    </span>
                                </div>
                        <?php }
                        } ?>

                    </div>
                    <div class="tab-panel-list">
                        <?php if (!empty($hp_category_2)) { ?>
                            <?php foreach ($hp_category_2 as $key => $item) { ?>
                                <div class="tabPanel">
                                    <form method="get" id="searchform" action="<?php echo get_permalink(HP_WC_PRODUCTS) ?>">
                                        <div class="home-search-bar">
                                            <div class="location">
                                                <i class="far fa-map-marker-alt"></i>
                                                <?php if (!empty($address)) { ?>
                                                    <select class="re-select-main" name="taxonomie[category_address][]">
                                                        <option value="">Địa điểm</option>
                                                        <?php foreach ($address as $key => $value) { ?>
                                                            <option value="<?php echo $value->slug ?>"><?php echo $value->name ?></option>
                                                        <?php } ?>
                                                    </select>
                                                <?php } ?>
                                            </div>
                                            <div class="header-srch">
                                                <div class="searchform">
                                                    <div class="header-srch-input">
                                                        <input type="text" name="s" value="" id="s" placeholder="Nhập địa điểm, dự án. Ví dụ: Quận Đống đa">
                                                        <button class="btn btn-pri" type="submit">
                                                            <span class="text"></span>
                                                            <span class="icon">
                                                                <i class="fal fa-search"></i>
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        <div class="home-filters">
                                            <?php
                                            $caterory_child = get_terms(
                                                array(
                                                    'taxonomy' => 'product_cat',
                                                    'hide_empty' => true,
                                                    'parent' => $item->term_id,
                                                )
                                            );
                                            if (!empty($caterory_child)) { ?>
                                                <select class="re-select-main" name="taxonomie[product_cat][]">
                                                    <option value="">Loại nhà đất</option>
                                                    <?php foreach ($caterory_child as $key => $value) { ?>
                                                        <option value="<?php echo $value->slug ?>">
                                                            <?php echo $value->name ?></option>
                                                    <?php } ?>
                                                </select>
                                            <?php } ?>
                                            <select class="re-select-main" name="price">
                                                <option value="">Mức giá</option>
                                                <option value="50000000"> Dưới 50.000.000 VNĐ</option>
                                                <option value="100000000">50.000.000 - 100.000.000 VNĐ</option>
                                                <option value="200000000">100.000.000 - 200.000.000 VNĐ</option>
                                                <option value="300000000">Trên 200.000.000 VNĐ</option>
                                            </select>
                                            <?php if (!empty($dt)) { ?>
                                                <select class="re-select-main" name="taxonomie[pa_dien-tich][]">
                                                    <option value="">Diện tích</option>
                                                    <?php foreach ($dt as $key => $value) { ?>
                                                        <option value="<?php echo $value->slug ?>">
                                                            <?php echo $value->name ?></option>
                                                    <?php } ?>
                                                </select>
                                            <?php } ?>
                                        </div>
                                    </form>
                                </div>
                        <?php }
                        } ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>