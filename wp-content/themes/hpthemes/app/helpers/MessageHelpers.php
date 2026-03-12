<?php 
function get_message_success( $text = '' ) {
    $message = '';
    $message .= '<div class="toast__icon"><span class="dashicons dashicons-yes"></span></div>';
    $message .= '<div class="toast__body">';
    $message .= '<h3 class="toast__title">'.__( 'Thông báo!', 'hp-admin' ).'</h3>';
    $message .= '<p class="toast__msg">'.__( $text, 'hp-admin' ).'</p>';
    $message .= '</div>';
    $message .= '<div class="toast__close"><span class="dashicons dashicons-no"></span></div>';
    $message .= '<div class="progress"></div>';

    return $message;
}

function get_message_error( $text = '' ) {
    $message = '';
    $message .= '<div class="toast__icon"><span class="dashicons dashicons-info"></span></div>';
    $message .= '<div class="toast__body">';
    $message .= '<h3 class="toast__title">'.__( 'Thông báo!', 'hp-admin' ).'</h3>';
    $message .= '<p class="toast__msg">'.__( $text, 'hp-admin' ).'</p>';
    $message .= '</div>';
    $message .= '<div class="toast__close"><span class="dashicons dashicons-no"></span></div>';
    $message .= '<div class="progress"></div>';
    
    return $message;
}
