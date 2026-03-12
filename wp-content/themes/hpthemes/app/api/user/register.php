<?php
function mona_api_user_register(WP_REST_Request $request)
{
    try {
        $headers            = $request->get_headers();
        $body               = json_decode($request->get_body());

        $results            = [];
        $results['code']    = MONA_GET_DATA_SUCCESS;
        $results['status']  = 200;

        $userEmail          = isset($body->userEmail) ? esc_attr($body->userEmail) : '';
        $userName          = isset($body->userName) ? esc_attr($body->userName) : '';
        $userPassword       = isset($body->userPassword) ? esc_attr($body->userPassword) : '';
        $userRePassword     = isset($body->userRePassword) ? esc_attr($body->userRePassword) : '';
        $userPhone     = isset($body->userPhone) ? esc_attr($body->userPhone) : '';
        $userCheck     = isset($body->userCheck) ? esc_attr($body->userCheck) : '';


        if (empty($userCheck)) {
            throw new Exception(__('Vui lòng đồng ý với tất cả điều khoản', 'monamedia'));
        }

        $argsEmail = explode('@', $userEmail);
        if (!empty($argsEmail)) {
            $userLogin = $argsEmail[0];
        }

        $argsRegsiter = [
            'user_email'        => $userEmail,
            'user_login'        => $userLogin,
            'user_pass'         => $userPassword,
            'user_nicename'     => $userName,
            'display_name'      => $userName,
            'nickname'          => $userName,
            'role'              => 'customer',
            'first_name'        => isset($userNameFormatted['first_name'])
                ? $userNameFormatted['first_name']
                : '',
            'last_name'         => isset($userNameFormatted['last_name'])
                ? $userNameFormatted['last_name']
                : '',
        ];

        $user_id = wp_insert_user($argsRegsiter);
        if (is_wp_error($user_id)) {
            throw new Exception($user_id->get_error_message());
        }
        update_user_meta($user_id, 'billing_phone',  $userPhone);
        $args = [
            'user_login'    => @$userLogin,
            'user_password' => @$userPassword,
            'remember'      => true
        ];

        $on = wp_signon($args);
        if (is_wp_error($on)) {
            throw new Exception(__('Đã có lỗi xảy ra trong quá trình đăng nhập tài khoản của bạn', 'monamedia'));
        }
        $results['redirect'] = get_the_permalink(MONA_WC_MYACCOUNT);
        $admin_email = get_bloginfo('admin_email');
        $message  = __('Thông báo ' . $admin_email . ', ') . "\r\n\r\n";
        $message .= __('Một tài khoản  ' . $userLogin . ' vừa đăng ký vào website') . "\r\n\r";
        // Gửi email
        if ($message && !wp_mail($admin_email, wp_specialchars_decode($userLogin . ' đăng ký tài khoản'), $message)) {
            throw new Exception(
                sprintf(
                    __('Không thể gửi email. Vui lòng liên hệ với admin %s để được hỗ trợ', 'monamedia'),
                    get_bloginfo('name')
                )
            );
        }
        $results['message']  = __('Bạn đã đăng ký tài khoản thành công! Chúc bạn có một trải nghiệm mua sắm tại website chúng tôi', 'monamedia');
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
