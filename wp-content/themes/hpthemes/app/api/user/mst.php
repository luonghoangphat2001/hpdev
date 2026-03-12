<?php
function mona_api_user_mst(WP_REST_Request $request)
{
    try {
        $headers            = $request->get_headers();
        $body               = json_decode($request->get_body());

        $results            = [];
        $results['code']    = MONA_GET_DATA_SUCCESS;
        $results['status']  = 200;

        $mst               = isset($body->userCode) ? esc_attr($body->userCode) : '';

        $links = 'https://esgoo.net/api-mst/' . $mst . '.htm';
        $ch = curl_init($links);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Linux; Android 7.0; SM-T827R4 Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.116 Safari/537.36');
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        $result = curl_exec($ch);
        if (curl_errno($ch) != 0 && empty($result)) {
            $result = false;
        }
        curl_close($ch);
        $companies = json_decode($result, true);

        // Kiểm tra lỗi JSON
        if ($companies === null && json_last_error() !== JSON_ERROR_NONE) {
            echo 'Lỗi khi giải mã JSON';
            exit();
        }

        $results['message']  = $companies['error_text'];
        $results['data']  = $companies['data'];
        $results['status']  = 200;



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
