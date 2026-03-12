<?php
function mona_api_user_forgot(WP_REST_Request $request)
{
    try {
        $headers            = $request->get_headers();
        $body               = json_decode($request->get_body());

        $results            = [];
        $results['code']    = MONA_GET_DATA_SUCCESS;
        $results['status']  = 200;

        $userLogin          = isset($body->userLogin) ? esc_attr($body->userLogin) : '';
        $userPassword       = isset($body->userPassword) ? esc_attr($body->userPassword) : '';
        $userRedirect       = isset($body->userRedirect) ? esc_attr($body->userRedirect) : '';

        if (is_email($userLogin)) {
            $userReal = get_user_by('email', $userLogin);
        } elseif (isPhoneValidate($userLogin)) {
            $userReal = isPhoneRegistered($userLogin, false);
        } else {
            $userReal = get_user_by('login', $userLogin);
        }

        if (!$userReal) {
            throw new Exception(__('Tài khoản không tồn tại', 'monamedia'));
        }

        $userDisplayLogin = $userReal->user_login;
        $userDisplayEmail = $userReal->user_email;

        $result = strstr($userDisplayEmail, '@', true);
        if (!empty($result)) {
            $countResult = strlen($result);
            $userDisplayMessage = str_replace(
                substr($result, 0, ceil($countResult / 2)),
                '*****',
                $userDisplayEmail
            );
        } else {
            $userDisplayMessage = $userDisplayEmail;
        }

        $key = get_password_reset_key($userReal);
        $message  = __('Chào bạn ' . $userReal->display_name . ', ') . "\r\n\r\n";
        $message .= __('Bạn đã đề nghị lấy lại mật khẩu cho tài khoản trên ') . get_bloginfo('name') . "\r\n\r";
        $message .= __('Để lấy lại mật khẩu. Bạn vui lòng bấm vào đường dẫn bên dưới:') . "\r\n";

        if (empty($userRedirect)) {
            $message .= '<' . get_the_permalink(MONA_PAGE_UPDATE_PASS) . "?action=updatepass&reset&key=$key&login=" . rawurlencode($userDisplayLogin) . ">\r\n";
        } else {
            $message .= '<' . get_the_permalink(MONA_PAGE_UPDATE_PASS) . "?action=updatepass&reset&key=$key&login=" . rawurlencode($userDisplayLogin) . "&redirect=" . $userRedirect . ">\r\n";
        }

        if ($message && !wp_mail($userDisplayEmail, wp_specialchars_decode(get_bloginfo('name') . ' Đặt lại mật khẩu'), $message)) {
            throw new Exception(
                sprintf(
                    __('Không thể gửi email. Vui lòng liên hệ với admin %s để được hỗ trợ', 'monamedia'),
                    get_bloginfo('name')
                )
            );
        }

        $results['message']  = __('Email thay đổi mật khẩu đã được gửi đến email ', 'monamedia') . $userDisplayMessage .  __(' liên kết với tài khoản của bạn! Vui lòng kiểm tra hộp thư của bạn', 'monamedia');
        return $results;
    } catch (Exception $e) {
        return [
            'code'      => MONA_GET_DATA_NOT_FOUND,
            'message'   => $e->getMessage(),
            'status'    => 400,
            'responses' => [],
        ];
    }
}
