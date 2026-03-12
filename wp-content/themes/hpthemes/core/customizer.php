<?php
if (class_exists('Kirki')) {

    function kirki_demo_scripts()
    {
        wp_enqueue_style('kirki-demo', get_stylesheet_uri(), array(), time());
    }

    add_action('wp_enqueue_scripts', 'kirki_demo_scripts');

    $priority = 1;

    /**
     * Add panel
     */
    // Kirki::add_panel( 'panel_contacts', 
    //     [
    //         'title'     => __( 'Liên hệ', 'hp-admin' ),
    //         'priority'   => $priority++,
    //         'capability' => 'edit_theme_options',
    //     ]
    // );

    /**
     * Add section
     */
    // Kirki::add_section(
    //     'section_sidebar',
    //     [
    //         'title'      => __('SideBar', 'hp-admin'),
    //         'priority'   => $priority++,
    //         'capability' => 'edit_theme_options',
    //     ]
    // );

    // /**
    //  * Add field
    //  */
    // Kirki::add_field(
    //     'hp_setting',
    //     [
    //         'type'        => 'text',
    //         'settings'    => 'section_sidebar_text',
    //         'label'       => __('Hình ảnh', 'hp-admin'),
    //         'description' => '',
    //         'help'        => '',
    //         'section'     => 'section_sidebar',
    //         'default'     => '',
    //         'priority'    => $priority++,
    //     ]
    // );

    /**
     * Add field 
     */
    // kirki::add_field( 'hp_setting', [
    //     'type'        => 'repeater',
    //     'label'       => __( 'Danh sách liên kết', 'hp-admin' ),
    //     'section'     => 'section_contact_socials',
    //     'priority'    =>  $priority++,
    //     'row_label' => [
    //         'type'  => 'text',
    //         'value' => __( 'Liên kết', 'hp-admin' ),

    //     ],
    //     'button_label' => __( 'Thêm mới', 'hp-admin' ),
    //     'settings'     => 'contact_social_items',
    //     'fields' => [
    //         'icon' => [
    //             'type'        => 'image',
    //             'label'       => __( 'Icon', 'hp-admin' ),
    //             'description' => '',
    //             'default'     => '',
    //         ],
    //         'link' => [
    //             'type'        => 'text',
    //             'label'       => __( 'Link', 'hp-admin' ),
    //             'description' => '',
    //             'default'     => '',
    //         ],
    //     ]
    // ]);

}

if (!function_exists('hp_option')) {

    function hp_option($setting, $default = '')
    {
        echo hp_get_option($setting, $default);
    }

    function hp_get_option($setting, $default = '')
    {
        if (class_exists('Kirki')) {
            $value = $default;
            $options = get_option('option_name', array());
            $options = get_theme_mod($setting, $default);
            if (isset($options)) {
                $value = $options;
            }
            return $value;
        }
        return $default;
    }
}
