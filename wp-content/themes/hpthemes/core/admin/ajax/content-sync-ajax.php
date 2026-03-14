<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'wp_ajax_hp_export_content', function () {
    check_ajax_referer( 'hp_content_sync_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( [ 'message' => 'Permission denied.' ] );
    }

    if ( ! class_exists( 'HP_Content_Sync' ) ) {
        wp_send_json_error( [ 'message' => 'HP_Content_Sync class not found.' ] );
    }

    $summary = HP_Content_Sync::export();

    $lines = [];
    foreach ( $summary as $post_type => $count ) {
        $lines[] = $post_type . ': ' . $count . ' posts';
    }

    wp_send_json_success( [
        'message' => 'Export thành công!',
        'summary' => $lines,
        'time'    => current_time( 'H:i:s d/m/Y' ),
    ] );
} );
