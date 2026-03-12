<?php 
if ( class_exists ( 'Hp_Admin' ) ) {
    class Hp_Setting_Overview extends Hp_Admin {

        protected $page = 'overview';
    
        public function __resgsiter_scripts() 
        {
            // loading css
            wp_enqueue_style( 'hp-style-'.esc_attr( $this->page ).'-template', get_template_directory_uri() . '/core/admin/assets/css/admin-'.esc_attr( $this->page ).'.css', array(), $this->version, 'all' );
            // loading js
            wp_enqueue_script( 'hp-script-'.esc_attr( $this->page ).'-template', get_template_directory_uri() . '/core/admin/assets/js/admin-'.esc_attr( $this->page ).'.js', array( 'wp-color-picker' ), $this->version, true );
            wp_localize_script( 'hp-script-'.esc_attr( $this->page ).'-template', 'Hp_Admin_ajax', 
                [
                    'ajaxURL'  => admin_url('admin-ajax.php'),
                    'adminURL' => get_admin_url(),
                    'siteURL'  => get_site_url(),
                ]
            );
        }

        public function __resgsiter_settings() 
        {
            $resgsiter_options = $this->__resgsiter_options();
            if ( ! empty ( $resgsiter_options ) ) {
                foreach ( $resgsiter_options as $key => $option ) {
                    register_setting( $this->__option_page(), $this->__option_name( $key ), $option ); 
                }
            }
        }

        public function __resgsiter_options()
        {
            return [
                'notice_hide_all' => [
                    'type'              => 'boolean', 
                    'sanitize_callback' => null,
                    'default'           => true,
                ],
            ];
        }

        public function __title() 
        {
            return __( 'Tổng quan', 'hp-admin' );
        }

        public function __icon() 
        {
            return '<span class="dashicons dashicons-admin-settings"></span>';
        }

        public function __link() 
        {
            return esc_url( $this->admin_url ) . '&tab=' . $this->page;
        }

        public function __classes() 
        {
            // default class
            $classes = 'toolbar-menu-item';
            // check current page
            if ( $this->currentPage === $this->page ) {
                $classes .= ' current-page';
            }
            // result string class html
            return esc_attr( $classes );
        }

        public function __action()
        {
            return esc_url( $this->admin_url ) . '&tab=' . $this->page;
        }

        public function __field_name( $name = '' ) 
        {
            if ( empty ( $name ) ) {
                return;
            }
            // ressult string
            return $this->page . '['.esc_attr( $this->__get_key( $name ) ).']';
        }

        public function __field_value( $name = '', $default = false ) 
        {
            $cache_key   = $this->__option_name( $name );
            $cache_value = wp_cache_get( $cache_key, $this->__option_page() );
            if ( false === $cache_value ) { 
                $cache_value = get_option( $cache_key, $default );
                wp_cache_set( $cache_key, $cache_value, $this->__option_page(), HOUR_IN_SECONDS );
            }
            // ressult string
            return $cache_value;
        }

        public function __option_name( $name = '' ) 
        {
            if ( empty ( $name ) ) {
                return '';
            }
            return 'HP' . '_' . $this->page . '_' . $name;
        }

        public function __option_page() 
        {
            return 'HP' . '_' . $this->page;
        }

        public function __get_submit_value( $name = '' ) 
        {
            if ( empty ( $name ) ) {
                return false;
            }
            // get request
            return isset ( $_POST[$this->page][$this->__get_key( $name )] ) ? $_POST[$this->page][$this->__get_key( $name )] : '';
        }

        public function __get_reuqest_value( $name = '', $formdata = [] ) 
        {
            if ( empty ( $name ) ) {
                return false;
            }
            // get request
            return isset ( $formdata[$this->page][$this->__get_key( $name )] ) ? $formdata[$this->page][$this->__get_key( $name )] : '';
        }

        public function __get_key( $name = '' ) 
        {
            if ( empty ( $name ) ) {
                return '';
            }
            return esc_attr( $name );
        }

        public function __nonce_key() 
        {
            return $this->__option_page() . '-options';
        }
        
        public function __template() 
        {
            $header    = $this->__field_value( 'header_script', '' );
            $footer    = $this->__field_value( 'footer_script', '' );
            $hideAll   = $this->__field_value( 'notice_hide_all', true );
            ?>
            <div class="hp-row setN" id="head_footer_code_settings">
                <div class="hp-col-xl full hp--adminNotice">
                    <div class="hp-card">
                        <div class="card-header">
                            <div class="card-title"><?php echo __( 'Thông báo/Cập nhật', 'hp-admin' ) ?></div>
                        </div>
                        <div class="card-body">
                            <div class="hp-row hp--subCard">
                                <div class="hp-col-xl">
                                    <div class="form-field">
                                        <?php 
                                        hp_render_field_settings(
                                            [
                                                'type'   => 'truefalse',
                                                'name'   => $this->__field_name( 'notice_hide_all' ),
                                                'id'     => $this->__field_name( 'notice_hide_all' ),
                                                'value'  => $hideAll,
                                                'title'  => __( 'Ẩn tất cả', 'hp-admin' ),
                                                'docs'   => false,
                                            ]
                                        );
                                        ?>
                                        <div class="note-text"><?php echo __( 'Tuỳ chọn này sẽ ẩn tất cả các thẻ thông báo <code>core</code> <code>plugin</code>', 'hp-admin' ) ?></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php 
        }
    }
}