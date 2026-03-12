<?php
add_action('after_setup_theme', 'add_after_setup_theme');
function add_after_setup_theme()
{
    // regsiter menu
    register_nav_menus(
        [
            'primary-menu' => __('Theme Main Menu', 'HPmedia'),
            'category-product-menu' => __('Theme Category Product Menu', 'HPmedia'),

        ]
    );
    // add size image
    // add_image_size( 'banner-desktop-image', 1920, 790, false );
    // add_image_size( 'banner-mobile-image', 400, 675, false );

    add_theme_support('woocommerce');
}

add_action('wp_enqueue_scripts', 'hp_add_styles_scripts');
function hp_add_styles_scripts()
{
    // loading global themes styles + scripts
    do_config_enqueue_scripts('themes');
    // loading conditional page-specific scripts
    do_conditional_enqueue_scripts();
    // loading localize script (attached to jquery — always enqueued)
    wp_localize_script(
        'jquery',
        'hp_ajax_url',
        [
            'apiURL'    =>  get_site_url() . '/wp-json/advanced-monatheme/',
            'ajaxURL'   => admin_url('admin-ajax.php'),
            'siteURL'   => get_site_url(),
            'ajaxNonce' => wp_create_nonce('hp-ajax-security'),
        ]
    );
}

// Load frontend.css LAST (priority 20) — sau tất cả library CSS để override đúng thứ tự cascade
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style( 'hp-frontend', HP_THEME_PATH . '/public/css/frontend.css', [], THEME_VERSION );
}, 20);

add_filter('script_loader_tag', 'hp_add_module_to_my_script', 10, 3);
function hp_add_module_to_my_script($tag, $handle, $src)
{
    $module_handles = [
        'hp-mod-header', 'hp-mod-mobile', 'hp-mod-popup', 'hp-mod-side',
        'hp-mod-tab',    'hp-mod-check',  'hp-mod-spt',   'hp-mod-aos',
        'hp-mod-swiper', 'hp-mod-countup','hp-mod-select2','hp-mod-range',
        'hp-mod-loadmore','hp-mod-product','hp-mod-gallery','hp-mod-plusminus',
        'hp-mod-users',
    ];
    if ( in_array( $handle, $module_handles ) ) {
        $tag = '<script type="module" src="' . esc_url( $src ) . '"></script>';
    }
    return $tag;
}


add_action('wp_logout', 'hp_redirect_external_after_logout');
function hp_redirect_external_after_logout()
{
    wp_redirect(get_the_permalink(HP_PAGE_HOME));
    exit();
}



add_filter('pre_get_posts', 'hp_parse_request_post_type');
function hp_parse_request_post_type($query)
{
    if (!is_admin()) {
        $query->set('ignore_sticky_posts', true);
        $ptype = $query->get('post_type', true);
        $ptype = (array) $ptype;

        if (isset($_GET['s'])) {
            $ptype[] = 'post';
            $query->set('post_type', $ptype);
            $query->set('posts_per_page', 9);
        }
        if ($query->is_main_query() && $query->is_category()) {
            $ptype[] = 'post';
            $query->set('posts_per_page', 9);
            $query->set('post_type', $ptype);
        }

        if (is_home()) {
            $ptype[] = 'post';
            $query->set('posts_per_page', 9);
            $query->set('post_type', $ptype);
        }

        if ($query->is_post_type_archive('product') || ($query->is_main_query() && $query->is_tax('product_cat'))) {
            $ptype[] = 'product';
            $query->set('post_type', $ptype);
            $query->set('posts_per_page', 9);
            $meta_query = []; // Mảng để lưu điều kiện lọc meta
            $tax_query = [];
            if (isset($_GET['taxonomie']) && is_array($_GET['taxonomie']) && !empty($_GET['taxonomie'])) {
                $filtered_taxonomies = array_filter($_GET['taxonomie'], function ($slug) {
                    return is_array($slug) ? !empty(array_filter($slug)) : !empty($slug);
                });

                foreach ($filtered_taxonomies as $taxonomy => $slug) {

                    if (!empty($slug)) {
                        $tax_query[]  =  array(
                            'taxonomy'  => $taxonomy,
                            'field'     => 'slug',
                            'terms'     => $slug,
                            'operator'  => 'IN'
                        );
                    }
                }

                $query->set('tax_query', $tax_query);
            }
            if (isset($_GET['price']) && $_GET['price'] !== '') {
                $price = intval($_GET['price']);
                $meta_query = array();

                switch ($price) {
                    case 50000000:
                        $meta_query[] = array(
                            'key' => '_price',
                            'value' => 50000000,
                            'type' => 'DECIMAL',
                            'compare' => '<='
                        );
                        break;
                    case 100000000:
                        $meta_query[] = array(
                            'key' => '_price',
                            'value' => array(50000000, 100000000),
                            'type' => 'DECIMAL',
                            'compare' => 'BETWEEN'
                        );
                        break;
                    case 200000000:
                        $meta_query[] = array(
                            'key' => '_price',
                            'value' => array(100000000, 200000000),
                            'type' => 'DECIMAL',
                            'compare' => 'BETWEEN'
                        );
                        break;
                    case 300000000:
                        $meta_query[] = array(
                            'key' => '_price',
                            'value' => 200000000,
                            'type' => 'DECIMAL',
                            'compare' => '>='
                        );
                        break;
                }

                // Thêm vào meta_query
                $query->set('meta_query', $meta_query);
            }
            if (isset($_GET['price_min']) && $_GET['price_min'] !== '') {
                $meta_query[] = array(
                    'key' => '_price',
                    'value' => floatval($_GET['price_min']),
                    'type' => 'DECIMAL',
                    'compare' => '>='
                );
            }

            if (isset($_GET['price_max']) && $_GET['price_max'] !== '') {
                $meta_query[] = array(
                    'key' => '_price',
                    'value' => floatval($_GET['price_max']),
                    'type' => 'DECIMAL',
                    'compare' => '<='
                );
            }
            if (!empty($meta_query)) {
                $query->set('meta_query', $meta_query);
            }
        }
    }
    return $query;
}

add_action('widgets_init', 'hp_register_sidebars');
function hp_register_sidebars()
{

    register_sidebar(
        [
            'id'            => 'footer_columtop1',
            'name'          => __('Footer Column Top 1', 'hp-admin'),
            'description'   => __('Nội dung widget.', 'hp-admin'),
            'before_widget' => '<div id="%1$s" class="widget footer-menu-item footer-menu-item-first %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<h3 class="head footer-title">',
            'after_title'   => '</h3>',
        ]
    );
    register_sidebar(
        [
            'id'            => 'footer_columtop2',
            'name'          => __('Footer Column Top 2', 'hp-admin'),
            'description'   => __('Nội dung widget.', 'hp-admin'),
            'before_widget' => '<div id="%1$s" class="widget footer-menu-item footer-menu-item-first %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<h3 class="head footer-title">',
            'after_title'   => '</h3>',
        ]
    );
    register_sidebar(
        [
            'id'            => 'footer_column1',
            'name'          => __('Footer Column 1', 'hp-admin'),
            'description'   => __('Nội dung widget.', 'hp-admin'),
            'before_widget' => '<div id="%1$s" class="widget footer-menu-item footer-menu-item-first %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<h3 class="head footer-title">',
            'after_title'   => '</h3>',
        ]
    );
    register_sidebar(
        [
            'id'            => 'footer_column2',
            'name'          => __('Footer Column 2', 'hp-admin'),
            'description'   => __('Nội dung widget.', 'hp-admin'),
            'before_widget' => '<div id="%1$s" class="widget ft-box-nav footer-menu-item footer-menu-item-first %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<div class="head footer-title ft-box-head"><span class="t-text">',
            'after_title'   => '<span></div>',
        ]
    );
    register_sidebar(
        [
            'id'            => 'footer_column3',
            'name'          => __('Footer Column 3', 'hp-admin'),
            'description'   => __('Nội dung widget.', 'hp-admin'),
            'before_widget' => '<div id="%1$s" class="widget footer-menu-item footer-menu-item-first %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<h3 class="head footer-title">',
            'after_title'   => '</h3>',
        ]
    );
    register_sidebar(
        [
            'id'            => 'footer_column4',
            'name'          => __('Footer Column 4', 'hp-admin'),
            'description'   => __('Nội dung widget.', 'hp-admin'),
            'before_widget' => '<div id="%1$s" class="widget footer-menu-item footer-menu-item-first %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<h3 class="head footer-title">',
            'after_title'   => '</h3>',
        ]
    );

    register_sidebar(
        [
            'id'            => 'sidebar',
            'name'          => __('Sidebar ', 'hp-admin'),
            'description'   => __('Nội dung widget.', 'hp-admin'),
            'before_widget' => '<div id="%1$s" class="widget inner-image %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<h3 class="head footer-title">',
            'after_title'   => '</h3>',
        ]
    );
    register_sidebar(
        [
            'id'            => 'header_row_right',
            'name'          => __('Header right', 'hp-admin'),
            'description'   => __('Nội dung widget.', 'hp-admin'),
            'before_widget' => '<div id="%1$s" class="widget inner-image %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<h3 class="head footer-title">',
            'after_title'   => '</h3>',
        ]
    );
}

add_filter('display_post_states', 'hp_add_post_state', 10, 2);
function hp_add_post_state($post_states, $post)
{
    if ($post->ID == HP_PAGE_HOME) {
        $post_states[] = __('PAGE - Trang chủ', 'hp-admin');
    }
    if ($post->ID == HP_PAGE_BLOG) {
        $post_states[] = __('PAGE - Trang Tin tức', 'hp-admin');
    }
    return $post_states;
}

//add_filter( 'get_custom_logo', 'hp_change_logo_class' );
function hp_change_logo_class($html)
{
    $custom_logo_id = get_theme_mod('custom_logo');
    $html           = sprintf(
        '<a href="%1$s" class="header-icon" rel="home" itemprop="url"><div class="icon">%2$s</div></a>',
        esc_url(home_url()),
        wp_get_attachment_image(
            $custom_logo_id,
            'full',
            false,
            [
                'class'  => 'header-logo-image',
            ]
        )
    );
    return $html;
}

add_filter('admin_url', 'hp_filter_admin_url', 999, 3);
function hp_filter_admin_url($url, $path, $blog_id)
{
    if ($path === 'admin-ajax.php' && !is_admin()) {
        $url .= '?hp-ajax';
    }
    return $url;
}

add_filter('wp_get_attachment_image_attributes', 'hp_image_remove_attributes');
function hp_image_remove_attributes($attr)
{
    unset($attr['sizes']);
    return $attr;
}

add_action(' wp_footer', 'hp_filter_front_footer');
function hp_filter_front_footer()
{
    echo '<div id="hp-toast"></div>';
}

// add_filter('post_thumbnail_html', 'hp_set_post_thumbnail_default', 20, 5);
function hp_set_post_thumbnail_default($html, $post_id, $post_thumbnail_id, $size, $attr)
{
    if (empty($html)) {
        return wp_get_attachment_image(HP_CUSTOM_LOGO, 'full', "", ['class' => 'cg-image-default']);
    }
    return $html;
}



// yoast seo 
/**
 * Filter the output of Yoast breadcrumbs so each item is an <li> with schema markup
 * @param $link_output
 * @param $link
 *
 * @return string
 */
function doublee_filter_yoast_breadcrumb_items($link_output, $link)
{
    $new_link_output = '<li class="breadcrumb-item" data-aos="fade-left">';
    $new_link_output .= '<a class="breadcrumb-link" href="' . $link['url'] . '" >' . $link['text'] . '</a>';
    $new_link_output .= '</li>';
    return $new_link_output;
}
add_filter('wpseo_breadcrumb_single_link', 'doublee_filter_yoast_breadcrumb_items', 10, 2);

/**
 * Filter the output of Yoast breadcrumbs to remove <span> tags added by the plugin
 * @param $output
 *
 * @return mixed
 */
function doublee_filter_yoast_breadcrumb_output($output)
{
    $from = '<span>';
    $to = '</span>';
    $output = str_replace($from, $to, $output);
    return $output;
}
add_filter('wpseo_breadcrumb_output', 'doublee_filter_yoast_breadcrumb_output');

/**
 * Shortcut function to output Yoast breadcrumbs
 * wrapped in the appropriate markup
 */
function doublee_breadcrumbs()
{
    if (function_exists('yoast_breadcrumb')) {
        yoast_breadcrumb('<ul class="breadcrumb-list">', '</ul>');
    }
}


add_filter('posts_where', 'wpse18703_posts_where', 10, 2);
function wpse18703_posts_where($where, $wp_query)
{
    global $wpdb;
    if ($wpse18703_title = $wp_query->get('hp_search_title')) {
        $where .= ' AND ' . $wpdb->posts . '.post_title LIKE \'%' . esc_sql($wpdb->esc_like($wpse18703_title)) . '%\'';
    }
    return $where;
}





add_filter('big_image_size_threshold', '__return_false');
add_filter('woocommerce_get_price_html', 'mona_custom_price_html', 100, 2);
function mona_custom_price_html($price, $product)
{
    $html = "";
    switch ($product->get_type()) {
        case 'simple':
            if ($product->is_on_sale()) {
                $discount_percentage = round((($product->get_regular_price() - $product->get_price()) / $product->get_regular_price()) * 100);
                $html .= '<p class="price-new">' . wc_price($product->get_price()) . ' </p>';
                $html .= '<p class="price-old">' . wc_price($product->get_regular_price()) . '</p>';
                $html .= '<p class="sale">-' . $discount_percentage . '%</p>';
            } else {
                $html .= '<p class="price-new">' . wc_price($product->get_price()) . ' </p>';
            }
            break;
        case 'variable':
            $variations = $product->get_available_variations();
            if (!empty($variations)) {
                usort($variations, function ($a, $b) {
                    return $a['display_price'] - $b['display_price'];
                });
                $lowest_price = $variations[0]['display_price'];
                $lowest_regular_price = $variations[0]['display_regular_price'];
                $highest_price = end($variations)['display_price'];
                if ($product->is_on_sale() && $lowest_price < $lowest_regular_price) {
                    $discount_percentage = round((($lowest_regular_price - $lowest_price) / $lowest_regular_price) * 100);
                    $html .= '<p class="price-new">' . wc_price($lowest_price) . ' </p>';
                    $html .= '<p class="price-old">' . wc_price($lowest_regular_price) . '</p>';
                    $html .= '<p class="sale">-' . $discount_percentage . '%</p>';
                } else {
                    if ($lowest_price == $highest_price) {
                        $html .= '<p class="price-new">'  . wc_price($lowest_price) . ' </p>';
                    } else {
                        $html .= '<p class="price-new">' . wc_price($lowest_price) . ' - ' . wc_price($highest_price) . ' </p>';
                    }
                }
            }
            break;

        case 'variation':
            if ($product->is_on_sale()) {
                $regular_price = $product->get_regular_price();
                $sale_price = $product->get_price();
                if ($sale_price < $regular_price) {
                    $discount_percentage = round((($regular_price - $sale_price) / $regular_price) * 100);
                    $html .= '<p class="price-new">' . wc_price($sale_price) . ' </p>';
                    $html .= '<p class="price-old">' . wc_price($regular_price) . '</p>';
                    $html .= '<p class="sale">-' . $discount_percentage . '%</p>';
                } else {
                    $html .= '<p class="price-new">' . wc_price($regular_price) . '</p>';
                }
            } else {
                $html .= '<p class="price-new">' . wc_price($product->get_price()) . '</p>';
            }
            break;

        default:
            return $price;
    }
    if ($product->get_price() == 0 || $product->get_price() == '') {
        $html = '<p class="price-new">Liên hệ </p>';
    }

    return $html;
}
