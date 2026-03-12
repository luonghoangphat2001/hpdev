<?php 
class NoticeController {

    public static function Error( string $ststus = '404', string $message = 'Error', $rederect = '', $responses = '' ) 
    {
        $messages = [
            'status'    => esc_attr( $ststus ),
            'message'   => esc_html( $message ),
            'rederect'  => esc_url( $rederect ),
            'responses' => $responses,
            'success'   => false,
        ];
        return $messages;
    }

    public static function Success( string $ststus = '200', string $message = 'Get data success', $rederect = '', $responses = '' ) 
    {
        $messages = [
            'status'    => esc_attr( $ststus ),
            'message'   => esc_html( $message ),
            'rederect'  => esc_url( $rederect ),
            'responses' => $responses,
            'success'   => true,
        ];
        return $messages;
    }

}