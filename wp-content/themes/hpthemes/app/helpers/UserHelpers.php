<?php
class UserRoles
{

    private $id;
    private static $accountObject;
    private static $metaType;
    private static $currentMeta;


    public function __init()
    {
        #update user 
        add_action('wp_ajax_m_a_edit_account', [$this, 'm_a_edit_account']);

        #remove menu
        add_filter('woocommerce_account_menu_items', [$this, 'remove_my_account_links']);

        // thay đổi mật khẩu co dang nhap 
        add_action('wp_ajax_m_a_change_password', [$this, 'm_a_change_password']);

        // my acount change passsword
        add_action('woocommerce_account_change-password_endpoint', [$this, 'route_page_customer_support']);
        add_action('init', [$this, 'register_endpoint']);
    }
    public function error($code)
    {
        return http_response_code($code);
    }
    public function __construct()
    {
        if (is_user_logged_in()) {
            $this->id = get_current_user_id();
            self::$accountObject = get_userdata($this->id);
        }
    }

    public static function userMeta($metaName = '')
    {
        if (!empty($metaName)) {
            self::$currentMeta = esc_attr($metaName);
            self::$metaType    = 'user_meta';
        }
        return new self;
    }

    public static function userCustomField($metaName = '')
    {
        if (!empty($metaName)) {
            self::$currentMeta = esc_attr($metaName);
            self::$metaType    = 'custom_field';
        }
        return new self;
    }

    public function get()
    {
        $currentMeta = self::$currentMeta;
        $metaType    = self::$metaType;
        switch ($metaType) {
            case 'user_meta';
                global $Supports;
                $supportAccount = isset($Supports['account']) ? $Supports['account'] : '';
                if (!empty($supportAccount)) {
                    $accountFields = isset($supportAccount['fields']) ? $supportAccount['fields'] : [];
                    if (!empty($accountFields) && in_array(self::$currentMeta, $accountFields)) {
                        return self::$accountObject->$currentMeta;
                    } else {
                        return [
                            'message' => __('Trường thông tin không tồn tại!', 'HPmedia'),
                            'status'  => '404'
                        ];
                    }
                }
                break;
            case 'custom_field';
                break;
        }
    }

    public function display()
    {
        $currentMeta = self::$currentMeta;
        $metaType    = self::$metaType;
        switch ($metaType) {
            case 'user_meta';
                global $Supports;
                $supportAccount = isset($Supports['account']) ? $Supports['account'] : '';
                if (!empty($supportAccount)) {
                    $accountFields = isset($supportAccount['fields']) ? $supportAccount['fields'] : [];
                    if (!empty($accountFields) && in_array(self::$currentMeta, $accountFields)) {
                        echo self::$accountObject->$currentMeta;
                    } else {
                        return [
                            'message' => __('Trường thông tin không tồn tại!', 'HPmedia'),
                            'status'  => '404'
                        ];
                    }
                }
                break;
            case 'custom_field';
                break;
        }
    }
    public function icon_item_menu($endpoint)
    {
        $arr = [
            'dashboard' => [
                'icon' => '/assets/images/acc-icon.svg',
            ],

            'orders' => [
                'icon' => '/assets/images/acc-icon2.svg',
            ],
            'change-password' => [
                'icon' => '/assets/images/acc-icon3.svg',
            ],
        ];
        if (isset($arr[$endpoint])) {
            $icon = HP_THEME_PATH . '/public/images' . $arr[$endpoint]['icon'];
            return $icon;
        }
        return false;
    }

    function remove_my_account_links($menu_links)
    {

        unset($menu_links['downloads']);
        unset($menu_links['customer-logout']);
        unset($menu_links['edit-account']);
        unset($menu_links['edit-address']);
        // unset($menu_links['orders']);
        $menu_links['dashboard']  = __('Thông tin tài khoản', 'HPmedia');
        $menu_links['orders']  = __('Danh sách đơn hàng', 'HPmedia');
        $menu_links['change-password']  = __('Thay đổi mật khẩu', 'HPmedia');

        return $menu_links;
    }



    public function route_page_customer_support()
    {
        wc_get_template('myaccount/change-password.php');
    }
    public function register_endpoint()
    {

        add_rewrite_endpoint('change-password', EP_ROOT | EP_PAGES);
        flush_rewrite_rules();
    }

    private function check_password($old_pass, $id_user)
    {
        $hash = get_userdata($id_user)->user_pass;
        $check = wp_check_password($old_pass, $hash, $id_user);
        return $check;
    }
    function check_verify($pass1, $pass2)
    {
        return $pass1 === $pass2;
    }
    public function m_a_edit_account()
    {
        $data       = isset($_POST) ? $_POST : [];

        $DisplayName = esc_attr($data['m-edit-name']);
        $email = esc_attr($data['m-edit-email']);

        $userphone = esc_attr($data['user_phone']);
        $userPosition = esc_attr($data['userPosition']);
        $company_taxcode = esc_attr($data['company_taxcode']);
        $company = esc_attr($data['company']);
        $address_company = esc_attr($data['address_company']);
        $shipping_name = esc_attr($data['shipping_name']);
        $shipping_phone = esc_attr($data['shipping_phone']);
        $shipping_emaill = esc_attr($data['shipping_emaill']);
        $address_shipping = esc_attr($data['address_shipping']);
        $bill_name = esc_attr($data['bill_name']);
        $bill_email = esc_attr($data['bill_email']);
        $bill_phone = esc_attr($data['bill_phone']);




        // unset($data['user-email']);

        $args = array(
            'ID' => $this->id,
            'display_name' => strip_tags($DisplayName),
            'user_email'    => $email,
        );

        $update = wp_update_user($args);
        if (is_wp_error($update)) {
            echo $update->get_error_message();
            $this->error(500);
            exit;
        }
        // if ($dateObj && $dateObj->format('d/m/Y') === $birthday) {
        update_user_meta($this->id, 'hp_user_phone', $userphone);
        update_user_meta($this->id, 'hp_user_fullname', $DisplayName);


        update_user_meta($this->id, 'billing_email', $bill_email);
        update_user_meta($this->id, 'billing_first_name', $bill_name);
        update_user_meta($this->id, 'billing_address_1', $address_shipping);
        update_user_meta($this->id, 'billing_phone', $bill_phone);




        update_user_meta($this->id, 'shipping_email', $shipping_emaill);
        update_user_meta($this->id, 'shipping_last_name', $shipping_name);
        update_user_meta($this->id, 'shipping_phone', $shipping_phone);
        update_user_meta($this->id, 'shipping_address_1', $address_shipping);



        update_user_meta($this->id, 'hp_user_taxcode', $company_taxcode);
        update_user_meta($this->id, 'hp_user_position', $userPosition);

        update_user_meta($this->id, 'hp_user_company', $company);
        update_user_meta($this->id, 'hp_user_address', $address_company);

        update_user_meta($this->id, 'hp_user_shipping_name', $shipping_name);
        update_user_meta($this->id, 'hp_user_shipping_tel', $shipping_phone);
        update_user_meta($this->id, 'hp_user_shipping_email', $shipping_emaill);
        update_user_meta($this->id, 'hp_user_shipping_address', $address_shipping);

        update_user_meta($this->id, 'hp_user_bill_name', $bill_name);
        update_user_meta($this->id, 'hp_user_bill_phone', $bill_phone);
        update_user_meta($this->id, 'hp_user_bill_email', $bill_email);

        wp_send_json_success(
            [
                'toast'    => [
                    // 'type'     => 'success',
                    // 'content'  => get_message_success('Successful!'),
                    // 'duration' => 5000,
                ],
                'template' => [
                    // 'html' => $html,
                ],
                'message' => 'Bạn đã gửi yêu cầu thành công',
                // 'url' => $redirect_url

            ]
        );
        wp_die();
    }
    public function m_a_change_password()
    {
        $formdata       = isset($_POST) ? $_POST : [];
        $currentPass =  $formdata['current-password'];
        $newPass =  $formdata['new-pass'];
        $newRepass =  $formdata['new-repass'];
        if ($currentPass != '' && $newPass != '') {
            if ($this->check_password($currentPass, $this->id)) {
                if ($this->check_verify($newPass, $newRepass)) {
                    $user_data = get_userdata($this->id);
                    wp_set_password($newPass, $this->id);
                    $args = array(
                        'user_login' => $user_data->user_login,
                        'user_password' => $newPass,
                    );
                    $on = wp_signon($args);
                    echo json_encode(['message' => __('Thay đổi mật khẩu thành công', 'HPmedia')]);
                    exit;
                } else {
                    $this->error(500);
                    echo json_encode(['message' => __('Thay đổi mật khẩu thành công', 'HPmedia')]);
                    // _e('Nhập lại mật khẩu sai', 'HPmedia');
                    exit;
                }
            } else {
                $this->error(500);
                echo json_encode(['message' => __('Thay đổi mật khẩu thành công', 'HPmedia')]);
                // _e('Mật khẩu cũ không chính xác', 'HPmedia');
                exit;
            };
        }
        exit;
    }
}
// (new UserRoles())->__init();
