<?php
function mona_api_user_send_OTP_SMS(WP_REST_Request $request)
{
    try {
        $headers            = $request->get_headers();
        $body               = json_decode($request->get_body());

        $results            = [];
        $results['code']    = MONA_GET_DATA_SUCCESS;
        $results['status']  = 200;

        $sdt          = isset($body->userPhoneOTP) ? esc_attr($body->userPhoneOTP) : '';
        $otp_send     = OPTSMS();
        $results['message']  = '<span class="red">*</span>Mã xác thực đã được gửi đến số điện thoại<span class="blue">' . $sdt . '</span> <br />
        Chức năng đang cập nhật nên OTP demo là: 1234';
        $results['otp']  =  $otp_send;
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
