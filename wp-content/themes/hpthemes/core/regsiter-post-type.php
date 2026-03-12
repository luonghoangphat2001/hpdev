<?php
function hp_regsiter_custom_post_types()
{
    $tax_address = [
        'labels' => [
            'name'              => __('Địa chỉ', 'hp-admin'),
            'singular_name'     => __('Địa chỉ', 'hp-admin'),
            'search_items'      => __('Tìm kiếm', 'hp-admin'),
            'all_items'         => __('Tất cả', 'hp-admin'),
            'parent_item'       => __('Địa chỉ', 'hp-admin'),
            'parent_item_colon' => __('Địa chỉ', 'hp-admin'),
            'edit_item'         => __('Chỉnh sửa', 'hp-admin'),
            'add_new'           => __('Thêm mới', 'hp-admin'),
            'update_item'       => __('Cập nhật', 'hp-admin'),
            'add_new_item'      => __('Thêm mới', 'hp-admin'),
            'new_item_name'     => __('Thêm mới', 'hp-admin'),
            'menu_name'         => __('Địa chỉ', 'hp-admin'),
        ],
        'hierarchical'      => true,
        'show_in_rest'      => true,
        'show_admin_column' => true,
        'has_archive'       => true,
        'public'            => true,
        'rewrite' => array(
            'slug' => 'dia-chi',
            'with_front' => true
        ),
        'capabilities' => [
            'manage_terms' => 'publish_posts',
            'edit_terms'   => 'publish_posts',
            'delete_terms' => 'publish_posts',
            'assign_terms' => 'publish_posts',
        ],
    ];
    register_taxonomy('category_address', 'product', $tax_address);


    flush_rewrite_rules();
}
// add_action('init', 'hp_regsiter_custom_post_types');

// ================================================================
// Custom Post Type: project
// ================================================================
add_action( 'init', 'hp_register_post_type_project' );
function hp_register_post_type_project() {
    register_post_type( 'project', [
        'labels' => [
            'name'               => __( 'Projects', 'hp-admin' ),
            'singular_name'      => __( 'Project', 'hp-admin' ),
            'add_new'            => __( 'Thêm mới', 'hp-admin' ),
            'add_new_item'       => __( 'Thêm Project mới', 'hp-admin' ),
            'edit_item'          => __( 'Chỉnh sửa Project', 'hp-admin' ),
            'new_item'           => __( 'Project mới', 'hp-admin' ),
            'view_item'          => __( 'Xem Project', 'hp-admin' ),
            'search_items'       => __( 'Tìm kiếm Project', 'hp-admin' ),
            'not_found'          => __( 'Không tìm thấy Project', 'hp-admin' ),
            'not_found_in_trash' => __( 'Không có Project trong thùng rác', 'hp-admin' ),
            'menu_name'          => __( 'Projects', 'hp-admin' ),
        ],
        'public'             => true,
        'has_archive'        => true,
        'show_in_rest'       => true,
        'menu_icon'          => 'dashicons-portfolio',
        'menu_position'      => 5,
        'supports'           => [ 'title', 'editor', 'thumbnail', 'excerpt' ],
        'rewrite'            => [ 'slug' => 'project', 'with_front' => false ],
    ] );
}

// ================================================================
// Taxonomy: category_project — danh mục dự án (F&B, TMDT, ...)
// ================================================================
add_action( 'init', 'hp_register_taxonomy_category_project' );
function hp_register_taxonomy_category_project() {
    register_taxonomy( 'category_project', 'project', [
        'labels' => [
            'name'              => __( 'Danh mục Project', 'hp-admin' ),
            'singular_name'     => __( 'Danh mục', 'hp-admin' ),
            'search_items'      => __( 'Tìm kiếm danh mục', 'hp-admin' ),
            'all_items'         => __( 'Tất cả danh mục', 'hp-admin' ),
            'edit_item'         => __( 'Chỉnh sửa danh mục', 'hp-admin' ),
            'update_item'       => __( 'Cập nhật danh mục', 'hp-admin' ),
            'add_new_item'      => __( 'Thêm danh mục mới', 'hp-admin' ),
            'new_item_name'     => __( 'Tên danh mục mới', 'hp-admin' ),
            'menu_name'         => __( 'Danh mục', 'hp-admin' ),
        ],
        'hierarchical'      => true,
        'public'            => true,
        'show_in_rest'      => true,
        'show_admin_column' => true,
        'rewrite'           => [ 'slug' => 'danh-muc-project', 'with_front' => false ],
    ] );
}
