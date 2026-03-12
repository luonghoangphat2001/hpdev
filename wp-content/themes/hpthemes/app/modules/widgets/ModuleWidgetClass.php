<?php
/**
 * Update version 2
 * Ngày 11-1-2022
 * Nội dung chỉnh sửa:
 *  - Cập nhật lại layout và chia file, chia thư mục
 *
 *  --------- Khoảng cách ---------------
 *
 * Update version 2.3
 * Ngày 25-1-2022
 * Nội dung chỉnh sửa:
 *  - Thêm trường nhập liệu field group
 *  - Thêm phần hiện hướng dẫn dùng field tại create_field(): docs = true,
 *  - Thay đổi cách gọi hàm ở class Hp_Widget_Callback
 * 
 *  *  --------- Khoảng cách ---------------
 *
 * Update version 2.5
 * Ngày 19-4-2022
 * Nội dung chỉnh sửa:
 *  - Fix hàm lấy url hình ảnh và một số lỗi khác
 *  - Thay đổi cách gọi hàm ở class Hp_Widget, Hp_Widget_Callback
 * 
 *  *  *  --------- Khoảng cách ---------------
 *
 * Update version 2.8
 * Ngày 19-4-2022
 * Nội dung chỉnh sửa:
 *  - Fix hàm lấy url hình
 *  - Thêm nút sắp sếp vị trí nội dung trong field [repeater]
 *  - Chỉnh sửa css và jquery
 *
 *  --------- Khoảng cách ---------------
 *
 * Class HP Custom Widget
 * Chức năng:
 * - Tạo field, render ra mã html từ dữ liệu đầu vào
 * - Các tham số phải có như:
 *  + $field_args
 *  + $field_args: [ type, name, value ]
 * - Đối với field repeater, group buộc phải có thêm mãng con với khóa là fields.
 */
define( 'MODULE_WIDGET_FOLDER', MODULE_PATH . '/widgets' );

class Hp_Widget extends Hp_Widget_Callback {

    /**
     * Undocumented function
     * Load css, js
     */
    function __construct() 
    {
        add_action( 'admin_enqueue_scripts', [$this, 'add_support_upload'] );
    }

    /**
     * Undocumented function
     *
     * Khởi tạo funtion
     * funtion tạo các field html từ dữ liệu truyền vào
     * @param array $field_args
     * @return void
     */
    public static function create_field( $field_args = [] ) 
    {
        $output = '';
        $field_type = isset( $field_args['type'] ) ? esc_attr( $field_args['type'] ) : '';
        if ( ! static::is_field( esc_attr( $field_args['type'] ) ) ) {
            $field_type = 'not_found';

        }
        switch ( $field_type ) :
            case 'text':
                static::widget_inc_field( 'class.field_Text',
                    [
                        'func_class' => 'Render_Field_Text',
                        'field_args' => $field_args,
                    ]
                );
                break;
            case 'textarea':
                static::widget_inc_field( 'class.field_Textarea',
                    [
                        'func_class' => 'Render_Field_Textarea',
                        'field_args' => $field_args,
                    ]
                );
                break;
            case 'image':
                static::widget_inc_field( 'class.field_Image',
                    [
                        'func_class' => 'Render_Field_Image',
                        'field_args' => $field_args,
                    ]
                );
                break;
            case 'select':
                static::widget_inc_field( 'class.field_Select',
                    [
                        'func_class' => 'Render_Field_Select',
                        'field_args' => $field_args,
                    ]
                );
                break;
            case 'radio':
                static::widget_inc_field( 'class.field_Radio',
                    [
                        'func_class' => 'Render_Field_Radio',
                        'field_args' => $field_args,
                    ]
                );
                break;
            case 'checkbox':
                static::widget_inc_field( 'class.field_Checkbox',
                    [
                        'func_class' => 'Render_Field_Checkbox',
                        'field_args' => $field_args,
                    ]
                );
                break;
            case 'gallery':
                static::widget_inc_field( 'class.field_Gallery',
                    [
                        'func_class' => 'Render_Field_Gallery',
                        'field_args' => $field_args,
                    ]
                );
                break;
            case 'group':
                static::widget_inc_field( 'class.field_Group',
                    [
                        'func_class' => 'Render_Field_Group',
                        'field_args' => $field_args,
                    ]
                );
                break;
            case 'repeater':
                static::widget_inc_field( 'class.field_Repeater',
                    [
                        'func_class' => 'Render_Field_Repeater',
                        'field_args' => $field_args,
                    ]
                );
                break;
            case 'truefalse':
                static::widget_inc_field( 'class.field_TrueFalse',
                    [
                        'func_class' => 'Render_Field_TrueFalse',
                        'field_args' => $field_args,
                    ]
                );
                break;
            default:
                static::field_not_found( $field_args['type'] );
                break;
        endswitch;
    }

    /**
     * Undocumented function
     *
     * @param string $fied_value
     * @return void
     */
    public static function update_field( $fied_value = '' ) 
    {
        if ( ! empty ( $fied_value ) && is_array( $fied_value ) ) {
            $instance = (array)$fied_value;
        } elseif ( ! empty ( $fied_value ) && ! is_array( $fied_value ) ) {
            $instance = $fied_value;
        } else {
            $instance = '';
        }
        return $instance;
    }

    /**
     * Undocumented function
     *
     * @return void
     */
    public static function add_support_upload() 
    {
        wp_enqueue_media();
        // loading css
        wp_enqueue_style( 'hp_style_widget_admin', get_template_directory_uri() .'/'. MODULE_WIDGET_FOLDER . '/assets/css/widget-style.css', array(), false, 'all' );
        // loading js
        wp_enqueue_script( 'hp_js_widget_admin', get_template_directory_uri() .'/'. MODULE_WIDGET_FOLDER . '/assets/js/widget-field.js', array(), false, true );
        // loading js
        wp_enqueue_script( 'hp_ui_widget_admin', get_template_directory_uri() .'/'. MODULE_WIDGET_FOLDER . '/assets/js/jquery-ui.js', array(), false, true );
    }

    /**
     * Undocumented function
     *
     * @param string $image_url
     * @return void
     */
    public static function get_image_id_by_url( $image_url = '' ) 
    {
        global $wpdb;
        if ( empty ( $image_url ) ) {
            return;
        }
        $attachment = $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM $wpdb->posts WHERE guid='%s';", $image_url ) );
        if ( ! empty ( $attachment ) ) {
            return $attachment[0];
        } else {
            return false;
        }
    }
}


if ( class_exists ( 'Hp_Widget' ) ) {
    new Hp_Widget();

    $widgetFiles = glob( get_template_directory() . MODULE_PATH . '/widgets/admin/*.php' );
    foreach ( $widgetFiles as $filePath ) {
        require_once( $filePath );
    }
}