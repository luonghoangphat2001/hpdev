<?php 
add_action( 'wp_ajax_mona_admin_ajax_update_comingsoon',  'mona_admin_ajax_update_comingsoon' ); // login
function mona_admin_ajax_update_comingsoon() {
    try {
        $formdata = isset( $_POST ) ? $_POST : [];
        // check class 
        $callBack = (new Hp_Setting_Coming_Soon());
        $optionss = $callBack->__resgsiter_options();
        // check nonce request
        $nonce = isset ( $formdata['_wpnonce'] ) ? esc_attr( $formdata['_wpnonce'] ) : '';
        if ( ! wp_verify_nonce( $nonce, $callBack->__nonce_key() ) ) {
            throw new Exception( 'Đã xảy ra lỗi! Vui lòng đóng trình duyệt và mở tại.' );
        }
        
        if ( is_array ( $optionss ) ) {
            foreach ( $optionss as $key => $option ) {
                update_option( $callBack->__option_name( $key ), $callBack->__get_reuqest_value( $key, $formdata ) );
                wp_cache_delete( $callBack->__option_name( $key ), $callBack->__option_page() );
            }
        }
        // result message or content template
        ob_start();
        $callBack->__template();
        echo wp_send_json_success(
            [
                'toast'    => [
                    'type'     => 'success',
                    'content'  => get_message_success( 'Cập nhật dữ liệu thành công.' ),
                    'duration' => 5000,
                ],
                'template' => ob_get_clean(),
            ]
        );
    } catch ( Exception $e ) {
        echo wp_send_json_error(
            [
                'toast'    => [
                    'type'    => 'error',
                    'content' => get_message_error( $e->getMessage() ),
                    'duration' => 5000,
                ],
                'template' => '',
            ]
        );
    }
    wp_die();
}