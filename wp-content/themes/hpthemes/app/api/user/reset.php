<?php
function mona_api_user_reset(WP_REST_Request $request)
{
    try {
        $headers            = $request->get_headers();
        $body               = json_decode($request->get_body());

        $results            = [];
        $results['code']    = MONA_GET_DATA_SUCCESS;
        $results['status']  = 200;

        $userKey            = isset($body->userKey) ? esc_attr($body->userKey) : '';
        $userLogin          = isset($body->userName) ? esc_attr($body->userName) : '';
        $userPassword       = isset($body->userPassword) ? esc_attr($body->userPassword) : '';
        $userRedirect       = isset($body->userRedirect) ? esc_attr($body->userRedirect) : '';

        if (is_email($userLogin)) {
            $userReal = get_user_by('email', $userLogin);
        } elseif (isPhoneValidate($userLogin)) {
            $userReal = isPhoneRegistered($userLogin, false);
        } else {
            $userReal = get_user_by('login', $userLogin);
        }
        // var_dump($body);
        // die;
        $check = check_password_reset_key(@$userKey, @$userLogin);
        if (is_wp_error($check)) {
            throw new Exception(__('Đường dẫn lấy lại mật khẩu đã hết hạn', 'monamedia'));
        }

        reset_password($userReal, @$userPassword);

        if (empty($userRedirect)) {
            $redirect = get_the_permalink(MONA_PAGE_LOGIN);
        } else {
            $redirect = get_the_permalink(MONA_PAGE_LOGIN) . '?redirect=' . $userRedirect;
        }

        $results['redirect'] = $redirect;
        $results['message']  = __('Bạn đã đổi mật khẩu thành công', 'monamedia');
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
