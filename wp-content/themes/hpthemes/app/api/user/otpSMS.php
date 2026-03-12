<?php
function mona_api_user_OTP_SMS(WP_REST_Request $request)
{
    try {
        $headers            = $request->get_headers();
        $body               = json_decode($request->get_body());

        $results            = [];
        $results['code']    = MONA_GET_DATA_SUCCESS;
        $results['status']  = 200;

        $otp          = isset($body->otp) ? esc_attr($body->otp) : '';

        $otp_send = OPTSMS();

        if ($otp != $otp_send['otp']) {
            throw new Exception(__('OTP không trùng khớp', 'monamedia'));
        }
        if (!empty($otp_send['id'])) {
            $results['message']  = __('Mã khách hàng của bạn là:', 'monamedia') . $otp['id'];
        }
        // $results['redirect']  = get_permalink(MONA_PAGE_OTP_SMS);
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
