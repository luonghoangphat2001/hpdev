<?php

define('NAMESPACE_APP_MOBILE', 'advanced-monatheme');
define('SITE_DEFAULT_LANGUAGE', 'vi');
define('MONA_GET_DATA_SUCCESS', 'mona_get_data_success');
define('MONA_GET_DATA_NOT_FOUND', 'mona_get_data_not_found');

class APIController
{

    public function __construct() {}

    public function __start()
    {
        add_action('rest_api_init', [$this, 'register_route_happyphone_api']);
    }

    public function register_route_happyphone_api()
    {
        $argsRegister = [
            'user/register' => [
                'namespace' => NAMESPACE_APP_MOBILE,
                'route'     => 'UserRegister',
                'options'   => [
                    'methods'  => 'POST',
                    'callback' => 'mona_api_user_register',
                    'args' => array(
                        'userName' => array(
                            'validate_callback' => 'mona_validate_param_empty'
                        ),
                        'userPhone' => array(
                            'validate_callback' => 'mona_validate_param_phone'
                        ),
                        'userLogin' => array(
                            'validate_callback' => 'mona_validate_param_empty'
                        ),
                        'userEmail' => array(
                            'validate_callback' => 'mona_validate_param_email'
                        ),
                        'userPassword' => array(
                            'validate_callback' => 'mona_validate_param_password'
                        ),
                        'userRePassword' => array(
                            'validate_callback' => 'mona_validate_param_password'
                        ),
                        'userCheck' => array(
                            'validate_callback' => 'mona_validate_param_empty'
                        ),
                        // 'userTel' => array(
                        //     'validate_callback' => 'mona_validate_param_phone'
                        // ),
                        // 'userTaxCode' => array(
                        //     'validate_callback' => 'mona_validate_param_taxcode'
                        // ),
                    ),
                    'permission_callback' => '__return_true'
                ],
            ],
            'user/login' => [
                'namespace' => NAMESPACE_APP_MOBILE,
                'route'     => 'UserLogin',
                'options'   => [
                    'methods'  => 'POST',
                    'callback' => 'mona_api_user_login',
                    'args' => array(
                        'userLogin' => array(
                            'validate_callback' => 'mona_validate_param_login'
                        ),
                        'userPassword' => array(
                            'validate_callback' => 'mona_validate_param_password'
                        ),
                    ),
                    'permission_callback' => '__return_true'
                ],
            ],
            'user/forgot' => [
                'namespace' => NAMESPACE_APP_MOBILE,
                'route'     => 'UserForgot',
                'options'   => [
                    'methods'  => 'POST',
                    'callback' => 'mona_api_user_forgot',
                    'args' => array(
                        'userLogin' => array(
                            'validate_callback' => 'mona_validate_param_login'
                        ),
                    ),
                    'permission_callback' => '__return_true'
                ],
            ],
            'user/reset' => [
                'namespace' => NAMESPACE_APP_MOBILE,
                'route'     => 'UserReset',
                'options'   => [
                    'methods'  => 'POST',
                    'callback' => 'mona_api_user_reset',
                    'args' => array(
                        'userKey' => array(
                            'validate_callback' => 'mona_validate_param_empty'
                        ),
                        'userLogin' => array(
                            'validate_callback' => 'mona_validate_param_empty'
                        ),
                        'userPassword' => array(
                            'validate_callback' => 'mona_validate_param_password'
                        ),
                        'userRePassword' => array(
                            'validate_callback' => 'mona_validate_param_password'
                        ),
                    ),
                    'permission_callback' => '__return_true'
                ],
            ],
        ];

        if (!empty($argsRegister)) {
            // $this->rest_load_cart();
            foreach ($argsRegister as $file => $itemReg) {
                $filePath = get_template_directory() . '/app/api/' . $file . '.php';
                if (file_exists($filePath)) {
                    require_once($filePath);
                    register_rest_route($itemReg['namespace'], $itemReg['route'], $itemReg['options']);
                }
            }
        }
    }

    public function rest_load_cart()
    {
        if (!WC()->is_rest_api_request()) {
            return;
        }

        WC()->frontend_includes();

        if (null === WC()->cart && function_exists('wc_load_cart')) {
            wc_load_cart();
        }
    }
}
// add_filter('woocommerce_store_api_disable_nonce_check', '__return_true');
