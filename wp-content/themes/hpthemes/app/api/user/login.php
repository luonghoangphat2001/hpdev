<?php
function mona_api_user_login(WP_REST_Request $request)
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
        $userRemember       = isset($body->userRemember) ? (esc_attr($body->userRemember) == 'on' ? true : '') : '';

        if (is_email($userLogin)) {
            $userReal = get_user_by('email', $userLogin);
        } elseif (isPhoneValidate($userLogin)) {
            $userReal = isPhoneRegistered($userLogin, false);
        } else {
            $userReal = get_user_by('login', $userLogin);
        }

        if (!$userReal) {
            throw new Exception(__('Tài khoản không tồn tại', 'hpdev'));
        }



        $argsLogin = [
            'user_login'    => @$userReal->user_login,
            'user_password' => @$userPassword,
            'remember'      => @$userRemember
        ];

        $on = wp_signon($argsLogin);
        if (is_wp_error($on)) {
            throw new Exception(__('Mật khẩu không đúng', 'hpdev'));
        }

        $results['redirect'] = !empty($userRedirect) ? $userRedirect : get_the_permalink(home_url('/'));
        $results['message']  = __('Bạn đã đăng nhập tài khoản thành công!', 'hpdev');
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
