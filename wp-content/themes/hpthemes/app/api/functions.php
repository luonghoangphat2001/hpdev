<?php
function mona_validate_param_login($param, $request, $key)
{
    if (empty($param)) {
        $message = __('Email/số điện thoại là bắt buộc', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if (!is_email($param) && isPhoneValidate($param) && isPhoneRegistered($param)) {
        $message = __('Tài khoản không tồn tại', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if (is_email($param) && !email_exists($param)) {
        $message = __('Tài khoản không tồn tại', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else {
        return true;
    }
}

function mona_validate_param_empty($param, $request, $key)
{
    if (empty($param)) {
        switch ($key) {
            case 'userName':
                $message = __('Họ và tên là bắt buộc', 'monamedia');
                break;

            case 'userCommit':
                $message = __('Cam kết là bắt buộc', 'monamedia');
                break;

            default:
                $message = __('Trường thông tin bắt buộc', 'monamedia');
                break;
        }
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else {
        return true;
    }
}

function mona_validate_param_phone($param, $request, $key)
{
    if (empty($param)) {
        $message = __('Số điện thoại là bắt buộc', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if (!isPhoneValidate($param)) {
        $message = __('Số điện thoại không hợp lệ', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if (!isPhoneRegistered($param)) {
        $message = __('Số điện thoại đã được đăng ký', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else {
        return true;
    }
}

function mona_validate_param_taxcode($param, $request, $key)
{
    if (empty($param)) {
        $message = __('Mã số thuế là bắt buộc', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if (!isTaxCodeValidate($param)) {
        $message = __('Mã số thuế không hợp lệ', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else {
        return true;
    }
}

function mona_validate_param_email($param, $request, $key)
{
    if (empty($param)) {
        $message = __('Email là bắt buộc', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if (!is_email($param)) {
        $message = __('Email không hợp lệ', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if (email_exists($param)) {
        $message = __('Email đã được đăng ký', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else {
        return true;
    }
}

function mona_validate_param_password($param, $request, $key)
{
    $body = json_decode($request->get_body());
    switch ($key) {
        case 'userRePassword':
            $label = __('Mật khẩu xác nhận', 'monamedia');
            break;

        default:
            $label = __('Mật khẩu', 'monamedia');
            break;
    }
    if (empty($param)) {
        $message = sprintf(__('%s là bắt buộc', 'monamedia'), $label);
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if (strlen($param) < 6) {
        $message = __('Mật khẩu phải có ít nhất 6 kí tự', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if ($key == 'userRePassword' && !empty(@$body->userPassword) && $param != $body->userPassword) {
        $message = __('Mật khẩu và mật khẩu xác nhận chưa trùng khớp', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else if ($key == 'userPassword' && !empty(@$body->userRePassword) && $param != $body->userRePassword) {
        $message = __('Mật khẩu và mật khẩu xác nhận chưa trùng khớp', 'monamedia');
        return new WP_Error(
            'rest_invalid_param',
            $message,
            // array( 'status' => 400 ) 
        );
    } else {
        return true;
    }
}

function isPhoneValidate($phone_number)
{
    if (preg_match('/^[0-9]{10}+$/', $phone_number)) {
        return true;
    } else {
        return false;
    }
}
function isTaxCodeValidate($phone_number)
{
    if (preg_match('/^[0-9-]{1,13}$/', $phone_number)) {
        return true;
    } else {
        return false;
    }
}
function SplitFullName($full_name)
{
    $name_parts = explode(" ", $full_name);
    $num_parts = count($name_parts);
    $first_name = "";
    $last_name = "";
    if ($num_parts == 1) {
        $first_name = $name_parts[0];
    } elseif ($num_parts == 2) {
        $first_name = $name_parts[1];
        $last_name = $name_parts[0];
    } else {
        $first_name = $name_parts[$num_parts - 1];
        $last_name = implode(" ", array_slice($name_parts, 0, $num_parts - 1));
    }
    $name_info = [
        'first_name' => $first_name,
        'last_name' => $last_name,
    ];
    return $name_info;
}
function isPhoneRegistered($phone_number, $flag = true)
{
    global $wpdb;
    $tbl_usermeta = $wpdb->prefix . 'usermeta';
    $user_id = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT user_id FROM $tbl_usermeta WHERE meta_key=%s AND meta_value=%s",
            'billing_phone',
            $phone_number
        )
    );
    $user = get_user_by('ID', $user_id);
    if (!empty($user)) {
        return $flag ? false : $user;
    } else {
        return true;
    }
}
function isTaxCodeRegistered($phone_number, $flag = true)
{
    global $wpdb;
    $tbl_usermeta = $wpdb->prefix . 'usermeta';
    $user_id = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT user_id FROM $tbl_usermeta WHERE meta_key=%s AND meta_value=%s",
            'mona_user_taxcode',
            $phone_number
        )
    );
    $user = get_user_by('ID', $user_id);
    if (!empty($user)) {
        return $flag ? false : $user;
    } else {
        return true;
    }
}
function isCurrentDateInRange($start_date, $end_date)
{
    $current_timestamp = current_time('timestamp');
    $start_timestamp = strtotime($start_date);
    $end_timestamp = strtotime($end_date);
    return ($current_timestamp >= $start_timestamp && $current_timestamp <= $end_timestamp);
}
