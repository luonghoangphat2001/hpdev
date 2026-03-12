<?php
function mona_api_user_forgotID(WP_REST_Request $request)
{
    try {
        global  $wpdb;
        $headers            = $request->get_headers();
        $body               = json_decode($request->get_body());

        $results            = [];
        $results['code']    = MONA_GET_DATA_SUCCESS;
        $results['status']  = 200;

        $userLogin          = isset($body->userLogin) ? esc_attr($body->userLogin) : '';
        $userRedirect       = isset($body->userRedirect) ? esc_attr($body->userRedirect) : '';

        if (is_email($userLogin)) {
            $userReal = get_user_by('email', $userLogin);
        } elseif (isPhoneValidate($userLogin)) {
            $userReal = isPhoneRegistered($userLogin, false);
        } else {
            $userReal = get_user_by('login', $userLogin);
        }
        $ID = get_user_meta($userReal->ID, 'mona_user_code', true);
        $userPhone = get_user_meta($userReal->ID, 'mona_user_phone', true);

        $opt = OPTSMS();

        if (!$userReal) {
            throw new Exception(__('Tài khoản không tồn tại', 'monamedia'));
        }
        $results['message']  = __('Mã OPT đã gửi đến số điện thoại ', 'monamedia') . $userPhone;
        $results['ID']       = $ID;
        $results['otp']      = $opt;
        $results['redirect']  = get_permalink(MONA_PAGE_OTP_SMS);
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
