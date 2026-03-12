<?php
function hp_pagination_links($wp_query = '')
{
    if ($wp_query == '') {
        global $wp_query;
    }
    $bignum = 999999999;
    if ($wp_query->max_num_pages <= 1) {
        return;
    }
    echo '<div class="paginations">';
    echo paginate_links(
        [
            'base'      => str_replace($bignum, '%#%', esc_url(get_pagenum_link($bignum))),
            'format'    => '',
            'current'   => max(1, get_query_var('paged')),
            'total'     => $wp_query->max_num_pages,
            'prev_text' => '<i class="fa fa-arrow-left" aria-hidden="true"></i>',
            'next_text' => '<i class="fa fa-arrow-right" aria-hidden="true"></i>',
            'type'      => 'list',
            'end_size'  => 3,
            'mid_size'  => 3
        ]
    );
    echo '</div>';
}

function hp_replace($value_num = '')
{
    if (empty($value_num)) {
        return;
    }
    $string   = preg_replace('/\s+/', '', $value_num);
    $stringaz = preg_replace('/[^a-zA-Z0-9_ -]/s', '', $string);
    return $stringaz;
}

function hp_replace_tel($hotline = '')
{
    if (empty($hotline)) {
        return;
    }
    $string   = preg_replace('/\s+/', '', $hotline);
    $stringaz = preg_replace('/[^a-zA-Z0-9_ -]/s', '', $string);
    $tel = 'tel:' . $stringaz;
    return $tel;
}

function get_post_term_ids($taxonomy = 'category',  $post_id = '')
{
    /**
     * Update version 2 
     * Date: 07/02/2024
     */

    $array_ids = [];
    if ($post_id == '') {
        $post_id = get_the_ID();
    }
    $term_list = wp_get_post_terms($post_id, $taxonomy);
    if (!empty($term_list)) {

        foreach ($term_list as $item) {
            $array_ids[] = $item->term_id;
        }
    } else {
        return;
    }

    return $array_ids;
}

function hp_set_post_view($post_id = '')
{
    if (empty($post_id)) {
        $post_id = get_the_ID();
    }
    $count_key = '_hp_post_view';
    $count = get_post_meta($post_id, $count_key, true);
    if ($count == '') {
        $count = 0;
        delete_post_meta($post_id, $count_key);
        add_post_meta($post_id, $count_key, '0');
    } else {
        $count++;
        update_post_meta($post_id, $count_key, $count);
    }
}

function hp_get_post_view($post_id = '')
{
    if (empty($post_id)) {
        $post_id = get_the_ID();
    }
    $count_key = '_hp_post_view';
    $count = get_post_meta($post_id, $count_key, true);
    if ($count == '') {
        delete_post_meta($post_id, $count_key);
        add_post_meta($post_id, $count_key, '0');
        return 0;
    }

    return $count;
}

function hp_get_home_title()
{
    $home_title = get_the_title(HP_PAGE_HOME);
    if ($home_title && $home_title != '') {
        $result_title = $home_title;
    } else {
        $result_title = __('Trang chủ', 'hp-admin');
    }

    return $result_title;
}

function hp_get_blogs_title()
{
    $blogs_title = get_the_title(HP_PAGE_BLOG);
    if ($blogs_title && $blogs_title != '') {
        $result_title = $blogs_title;
    } else {
        $result_title = __('Tin tức', 'hp-admin');
    }
    return $result_title;
}

function hp_get_blogs_url()
{
    $blogs_url = get_the_permalink(HP_PAGE_BLOG);
    return esc_url($blogs_url);
}

function breadcrumb_terms_list_html($term_id, $taxonomy, $args = array())
{
    $list = '';
    $term = get_term($term_id, $taxonomy);
    if (is_wp_error($term)) {
        return $term;
    }
    if (!$term) {
        return $list;
    }
    $term_id  = $term->term_id;
    $defaults = [
        'format'    => 'name',
        'separator' => '',
        'link'      => true,
        'inclusive' => true,
    ];
    $args = wp_parse_args($args, $defaults);
    foreach (array('link', 'inclusive') as $bool) {
        $args[$bool] = wp_validate_boolean($args[$bool]);
    }
    $parents = get_ancestors($term_id, $taxonomy, 'taxonomy');
    if ($args['inclusive']) {
        array_unshift($parents, $term_id);
    }
    $obz = get_queried_object();
    foreach (array_reverse($parents) as $term_id) {
        $parent = get_term($term_id, $taxonomy);
        $name   = ('slug' === $args['format']) ? $parent->slug : $parent->name;
        if ($obz->term_id != $term_id && $parent->parent == 0) {
            if ($args['link']) {
                $list .= '<li class="breadcrumb-list"><a class="item" href="' . esc_url(get_term_link($parent->term_id, $taxonomy)) . '">' . $name . '</a></li>' . $args['separator'];
            } else {
                $list .= $name . $args['separator'];
            }
        } else {
            $list .= '<li class="breadcrumb-list active"><a class="item" href="' . esc_url(get_term_link($parent->term_id, $taxonomy)) . '">' . $name . '</a></li>' . $args['separator'];
        }
    }

    return $list;
}

function hp_get_image_id_by_url($image_url = '')
{
    if (empty($image_url)) {
        return;
    }
    global $wpdb;
    $attachment = $wpdb->get_col($wpdb->prepare("SELECT ID FROM $wpdb->posts WHERE guid='%s';", $image_url));
    if (!empty($attachment)) {
        return $attachment[0];
    }
}

function is_terms_active($term_id = '', $taxonomy = 'category')
{
    $termsObj = get_the_terms(get_the_ID(), $taxonomy);
    $count = 0;
    if (empty($termsObj)) {
        return $count;
    } else {
        foreach ($termsObj as $key => $item) {
            if ($item->term_id === $term_id) {
                $count++;
            }
        }
    }

    return $count;
}

function hp_checked($method = '', $value = '')
{
    if (isset($method) && is_array($method) || is_object($method)) {
        foreach ($method as $key => $item) {
            if ($item === $value) {
                $checked = "checked='checked'";
                return $checked;
            }
        }
    } elseif (!empty($method) && !is_array($method)) {
        if ($method === $value) {
            $checked = "checked='checked'";
            return $checked;
        }
    } else {
        $checked = '';
        return $checked;
    }
}

function _term_get_ancestors_count($term_id = '', $taxonomy_type = 'category')
{
    if ($term_id == '') {
        return;
    }
    $ancestors = get_ancestors($term_id, $taxonomy_type);
    return isset($ancestors) ? (count($ancestors) + 1) : 1;
}

function content_exists($content_args = [])
{
    if (!empty($content_args)) {
        $done  = 0;
        $total = count($content_args);
        foreach ($content_args as $key => $value) {
            if (!is_array($value) && $value != '' || is_array($value) && content_exists($value)) {
                $done++;
            }
        }
        if (isset($done) && $done > 0) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}
function get_category_ids_by_object_id($id = '', $taxonomy = 'category')
{
    if (empty($id)) {
        $id = get_the_ID();
    }
    // Kiểm tra nếu đối tượng tồn tại
    if (!$id || !$taxonomy) {
        return false;
    }

    // Lấy danh sách các danh mục cho đối tượng
    $terms = wp_get_post_terms($id, $taxonomy);

    // Kiểm tra nếu danh mục tồn tại
    if (!$terms || is_wp_error($terms)) {
        return false;
    }

    // Lưu trữ ID của các danh mục
    $category_ids = array();

    // Lặp qua danh sách các danh mục và lưu trữ ID của chúng
    foreach ($terms as $term) {
        $category_ids[] = $term->term_id;
    }

    return $category_ids;
}


function show($args)
{
    if (get_current_user_id() == 1) {
        echo '<pre>';
        print_r($args);
        echo '</pre>';
    }
}

function hp_render_field_settings($args = [])
{
    if (class_exists('Hp_Widget')) {
        Hp_Widget::create_field($args);
    }
}

function hp_update_field_settings($fied_value = '')
{
    if (class_exists('Hp_Widget')) {
        Hp_Widget::update_field($fied_value);
    }
}


function get_avt_user()
{
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        $thumb = get_user_meta($user_id, '_avt', true);
        if (!empty($thumb)) {

            $img = wp_get_attachment_image($thumb, 'thumbnail');
        } else {
            $img =  '<img src="' . HP_THEME_PATH . '/public/images/user.png" alt="" srcset="">';
        }
        return $img;
    }
}


// fláh sale
function isProductFlashSale($product_id)
{
    if (empty($product_id))
        $product_id = get_the_ID();

    $flashSale = new FlashSaleController();
    if (is_array($flashSale->product_ids) && !empty($flashSale->product_ids)) {
        $productObj = wc_get_product($product_id);

        if ($productObj->is_type('variable')) {
            $variations = $productObj->get_available_variations();
            foreach ($variations as $variation) {
                if (in_array($variation['variation_id'], $flashSale->product_ids)) {
                    return true;
                }
            }
        } else {
            if (in_array($product_id, $flashSale->product_ids)) {
                return true;
            }
        }
    } else {
        return false;
    }
}
// function isCurrentDateInRange($start_date, $end_date)
// {
//     $current_timestamp = current_time('timestamp');
//     $start_timestamp = strtotime($start_date);
//     $end_timestamp = strtotime($end_date);
//     return ($current_timestamp >= $start_timestamp && $current_timestamp <= $end_timestamp);
// }
function getFlashSaleInformationByKey($key, $array)
{
    switch ($key) {
        case 'product_type':
            return array_filter(array_map(function ($item) {
                if ($item['product_stock'] > 0 && $item['product_stock_sold'] < $item['product_stock']) {
                    return $item['product_type'] ? $item['product_variation'] : $item['product_simple'];
                }
            }, $array));
            break;
        case 'product_price':
            return array_filter(array_map(function ($item) {
                if ($item['product_stock'] > 0 && $item['product_stock_sold'] < $item['product_stock']) {
                    return $item['product_price'];
                }
            }, $array));
            break;

        case 'product_stock':
            return array_filter(array_map(function ($item) {
                if ($item['product_stock'] > 0 && $item['product_stock_sold'] < $item['product_stock']) {
                    return $item['product_stock'];
                }
            }, $array));
            break;

        case 'product_stock_sold':
            return array_filter(array_map(function ($item) {
                if ($item['product_stock'] > 0 && $item['product_stock_sold'] < $item['product_stock']) {
                    return $item['product_stock_sold'];
                }
            }, $array));
            break;

        case 'product_stock_max':
            return array_filter(array_map(function ($item) {
                if ($item['product_stock'] > 0 && $item['product_stock_sold'] < $item['product_stock']) {
                    return $item['product_stock_max'];
                }
            }, $array));
            break;

        default:
            return $array;
            break;
    }
    return false;
}
function get_variation_parent_ids_from_term($term, $taxonomy, $type)
{
    global $wpdb;

    return $wpdb->get_col("SELECT DISTINCT p.ID
    FROM {$wpdb->prefix}posts as p
    INNER JOIN {$wpdb->prefix}posts as p2 ON p2.post_parent = p.ID
    INNER JOIN {$wpdb->prefix}term_relationships as tr ON p.ID = tr.object_id
    INNER JOIN {$wpdb->prefix}term_taxonomy as tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    INNER JOIN {$wpdb->prefix}terms as t ON tt.term_id = t.term_id
    WHERE p.post_type = 'product'
    AND p.post_status = 'publish'
    AND p2.post_status = 'publish'
    AND tt.taxonomy = '$taxonomy'
    AND t.$type = '$term'");
}



function get_html_sale($product)
{
    ob_start();
    if ($product->is_on_sale()) :

        if ($product->is_type('variable')) {
            $first_sale_variation = null;
            foreach ($product->get_available_variations() as $variation) {
                $sale_price = $variation['display_price'];
                $regular_price = $variation['display_regular_price'];

                if (!empty($sale_price) && $sale_price < $regular_price) {
                    $first_sale_variation = $variation;
                    break;
                }
            }
            if (!is_null($first_sale_variation)) {
                $min_sale_price = $first_sale_variation['display_price'];
                $max_regular_price = $first_sale_variation['display_regular_price'];
                $sale_percentage =  round((($max_regular_price - $min_sale_price) / $max_regular_price) * 100);
            }
        } else {
            $regular_price = $product->get_regular_price();
            $sale_price = $product->get_sale_price();
            $sale_percentage = round((($regular_price - $sale_price) / $regular_price) * 100);
        }
?>

        <div class="pro-tag">
            <?php
            if ($product->is_on_sale() || isProductFlashSale($product->get_id())) {
                echo '<span class="t-num">';
                echo apply_filters(
                    'woocommerce_sale_flash',
                    '<div class="pro-tag-item --pri">'
                        . esc_html__('-' . $sale_percentage . '%', 'woocommerce') .
                        '</div>',
                    $product
                );
                echo '</span>';
            } ?>

        </div>

<?php endif;
    return ob_get_clean();
}



function mona_set_thumbnail_default($post_thumbnail_id)
{
    if (empty($post_thumbnail_id)) {
        return wp_get_attachment_image(HP_CUSTOM_LOGO, 'full', "", ['class' => 'cg-image-default']);
    } else {
        return wp_get_attachment_image($post_thumbnail_id, 'full');
    }
}

function get_path_taxonomy_term_root(
    $taxonomy_id,
    $term_root = [],
    $taxonomy = "category"
) {
    if (!$taxonomy_id) {
        return;
    }

    $term_obj = get_term_by("id", $taxonomy_id, $taxonomy);

    if ($term_obj) {
        $term_root[$term_obj->slug] = $term_obj->term_id;
        if ($term_obj->parent == "0") {
            return array_reverse($term_root);
        } else {
            return get_path_taxonomy_term_root(
                $term_obj->parent,
                $term_root,
                $term_obj->taxonomy
            );
        }
    } else {
        return $term_root;
    }
}

function get_primary_taxonomy_term($post, $taxonomy = "category")
{
    if (!$post) {
        $post = get_the_ID();
    }
    $terms = get_the_terms($post, $taxonomy);
    $primary_term = [];
    if ($terms) {
        $term_display = "";
        $term_slug = "";
        $term_link = "";
        $term_id = "";
        $term_parent = "";
        if (class_exists("WPSEO_Primary_Term")) {
            $wpseo_primary_term = new WPSEO_Primary_Term($taxonomy, $post);
            $wpseo_primary_term = $wpseo_primary_term->get_primary_term();
            $term = get_term($wpseo_primary_term);
            if (is_wp_error($term)) {
                $term_display = $terms[0]->name;
                $term_slug = $terms[0]->slug;
                $term_link = get_term_link($terms[0]->term_id);
                $term_id = $terms[0]->term_id;
                $term_parent = $terms[0]->parent;
            } else {
                $term_display = $term->name;
                $term_slug = $term->slug;
                $term_link = get_term_link($term->term_id);
                $term_id = $term->term_id;
                $term_parent = $term->parent;
            }
        } else {
            $term_display = $terms[0]->name;
            $term_slug = $terms[0]->slug;
            $term_link = get_term_link($terms[0]->term_id);
            $term_id = $terms[0]->term_id;
            $term_parent = $terms[0]->parent;
        }
        $primary_term["id"] = $term_id;
        $primary_term["parent"] = $term_parent;
        $primary_term["url"] = $term_link;
        $primary_term["slug"] = $term_slug;
        $primary_term["title"] = $term_display;
    }
    return $primary_term;
}

function get_taxonomy_term_root($taxonomy_object)
{
    if (empty($taxonomy_object)) {
        return;
    }
    if ($taxonomy_object->parent != 0) {
        $taxonomy_object_parent = get_term_by(
            "id",
            $taxonomy_object->parent,
            $taxonomy_object->taxonomy
        );
        return get_taxonomy_term_root($taxonomy_object_parent);
    } else {
        return $taxonomy_object;
    }
}
