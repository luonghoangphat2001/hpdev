<?php
if ( class_exists ( 'Hp_Admin' ) ) {
    class HP_Filter_Page_Login extends Hp_Admin {
    
        public function __init() 
        {
            add_action( 'login_enqueue_scripts', [ $this, 'hp_style_login_template' ] );
        }
    
        public function hp_style_login_template() 
        {
            wp_enqueue_media();
            // loading css
            wp_enqueue_style( 'hp-style-login-template', get_template_directory_uri() . '/core/admin/assets/css/page-login.css', array(), $this->version, 'all' );
        }
    }
    
    (new HP_Filter_Page_Login())->__init();
}