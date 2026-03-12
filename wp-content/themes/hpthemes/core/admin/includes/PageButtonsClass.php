<?php 
if ( class_exists ( 'Hp_Admin' ) ) {
    class Hp_Setting_Buttons extends Hp_Admin {

        protected $page = 'buttons';
    
        public function __resgsiter_scripts() 
        {
            // loading css
            wp_enqueue_style( 'hp-style-call-buttons-template', get_template_directory_uri() . '/public/css/hp-call-buttons.css', array(), $this->version, 'all' );
            wp_enqueue_style( 'hp-style-'.esc_attr( $this->page ).'-template', get_template_directory_uri() . '/core/admin/assets/css/admin-'.esc_attr( $this->page ).'.css', array(), $this->version, 'all' );
            // loading js
            wp_enqueue_script( 'hp-script-'.esc_attr( $this->page ).'-template', get_template_directory_uri() . '/core/admin/assets/js/admin-'.esc_attr( $this->page ).'.js', array(), $this->version, true );
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
                'buttons' => [
                    'type'              => 'array', 
                    'default'           => [],
                ],
                'active' => [
                    'type'              => 'boolean', 
                    'sanitize_callback' => null,
                    'default'           => false,
                ],
                'desktop' => [
                    'type'              => 'boolean', 
                    'sanitize_callback' => null,
                    'default'           => false,
                ],
                'float' => [
                    'type'              => 'string', 
                    'sanitize_callback' => 'sanitize_text_field',
                    'default'           => 'left',
                ],
                'mobile' => [
                    'type'              => 'boolean', 
                    'sanitize_callback' => null,
                    'default'           => false,
                ],
                'bottom' => [
                    'type'              => 'string', 
                    'sanitize_callback' => 'sanitize_text_field',
                    'default'           => '8rem',
                ],
                'leftright' => [
                    'type'              => 'string', 
                    'sanitize_callback' => 'sanitize_text_field',
                    'default'           => '2rem',
                ],
            ];
        }

        public function __title() 
        {
            return __( 'Buttons', 'hp-admin' );
        }

        public function __icon() 
        {
            return '<span class="dashicons dashicons-admin-page"></span>';
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
            $active    = $this->__field_value( 'active', false );
            $buttons   = $this->__field_value( 'buttons', [] );
            $float     = $this->__field_value( 'float', 'left' );
            $btnLive   = $active ? 'preview-live' : 'preview-disabled';
            $desktop   = $this->__field_value( 'desktop', false );
            $mobile    = $this->__field_value( 'mobile', false );
            $bottom    = $this->__field_value( 'bottom', '8rem' );
            $leftright = $this->__field_value( 'leftright', '2rem' );
            ?>
            <div class="hp-row setN wrap-sticky">
                <div class="hp-col-xl hp--adminButtons">
                    <div class="hp-card">
                        <div class="card-header">
                            <div class="card-title"><?php echo __( 'Cài đặt chung', 'hp-admin' ) ?></div>
                        </div>
                        <div class="card-body">
                            <div class="hp-row hp--subCard">
                                <div class="hp-col-xl full">
                                    <div class="form-field">
                                        <?php 
                                        hp_render_field_settings(
                                            [
                                                'type'   => 'truefalse',
                                                'name'   => $this->__field_name( 'active' ),
                                                'id'     => $this->__field_name( 'active' ),
                                                'value'  => $active,
                                                'title'  => __( 'Kích hoạt', 'hp-admin' ),
                                                'docs'   => false,
                                            ]
                                        );
                                        ?>
                                    </div>
                                </div>
                                <div class="hp-col-xl full">
                                    <div class="form-field">
                                        <?php 
                                        hp_render_field_settings(
                                            [
                                                'type'   => 'repeater',
                                                'name'   => $this->__field_name( 'buttons' ),
                                                'id'     => $this->__field_name( 'buttons' ),
                                                'value'  => $buttons,
                                                'title'  => __( 'Danh sách nút liên hệ', 'hp-admin' ),
                                                'fields' => [
                                                    'icon' => [
                                                        'type'        => 'image',
                                                        'title'       => __( 'Icon', 'hp-admin' ),
                                                        'placeholder' => '',
                                                        'width'       => 42,
                                                        'default'     => get_template_directory_uri() . '/public/images/icon-location.png',
                                                    ],
                                                    'label' => [
                                                        'type'        => 'text',
                                                        'title'       => __( 'Tiêu đề', 'hp-admin' ),
                                                        'placeholder' => '',
                                                    ],
                                                    'value' => [
                                                        'type'        => 'text',
                                                        'title'       => __( 'Nội dung', 'hp-admin' ),
                                                        'placeholder' => '',
                                                    ],
                                                    'type' => [
                                                        'type'        => 'select',
                                                        'title'       => __( 'Loại', 'hp-admin' ),
                                                        'placeholder' => __( 'Chọn loại nút', 'HPmedia' ),
                                                        'select'      => [
                                                            'link'    => __( 'Link liên kết', 'hp-admin' ),
                                                            'phone'   => __( 'Số điện thoại', 'hp-admin' ),
                                                            'email'   => __( 'Email', 'hp-admin' ),
                                                            'zalo'    => __( 'Zalo', 'hp-admin' ),
                                                            'text'    => __( 'Văn bản', 'hp-admin' ),
                                                        ]
                                                    ],
                                                    'disabled' => [
                                                        'type'        => 'truefalse',
                                                        'title'       => __( 'Ẩn nút', 'hp-admin' ),
                                                        'placeholder' => '',
                                                    ],
                                                ],
                                                'docs'   => false,
                                            ]
                                        );
                                        ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hp-col-xl hp--adminPreview col-sticky">
                    <div class="hp-card preview-main">
                        <div class="card-header">
                            <div class="card-title"><?php echo __( 'Xem trước', 'hp-admin' ) ?></div>
                        </div>
                        <div class="card-body">
                            <div class="form-field">
                                <div class="admin-preview-buttons <?php echo $btnLive ?>">
                                    <?php $this->__front_template(); ?>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="preview-bottom"></div>
                </div>
                <div class="hp-col-xl hp--adminDesktop&Mobile">
                    <div class="hp-card">
                        <div class="card-header">
                            <div class="card-title"><?php echo __( 'Desktop/Mobile', 'hp-admin' ) ?></div>
                        </div>
                        <div class="card-body">
                            <div class="hp-row hp--subCard">
                                <div class="hp-col-xl full hp--adminDesktop">
                                    <div class="hp-card">
                                        <div class="card-header">
                                            <div class="card-title"><?php echo __( 'Desktop', 'hp-admin' ) ?></div>
                                        </div>
                                        <div class="card-body">
                                            <div class="form-field">
                                                <?php 
                                                hp_render_field_settings(
                                                    [
                                                        'type'   => 'truefalse',
                                                        'name'   => $this->__field_name( 'desktop' ),
                                                        'id'     => $this->__field_name( 'desktop' ),
                                                        'value'  => $desktop,
                                                        'title'  => __( 'Ẩn/hiện', 'hp-admin' ),
                                                        'docs'   => false,
                                                    ]
                                                );
                                                ?>
                                            </div>
                                            <div class="form-field">
                                                <?php 
                                                hp_render_field_settings(
                                                    [
                                                        'type'   => 'radio',
                                                        'name'   => $this->__field_name( 'float' ),
                                                        'id'     => $this->__field_name( 'desktop-float' ),
                                                        'value'  => $float,
                                                        'title'  => __( 'Canh lề', 'hp-admin' ),
                                                        'radio'  => [
                                                            'left'  => __( 'Trái', 'hp-admin' ),
                                                            'right' => __( 'Phải', 'hp-admin' ),
                                                        ],
                                                        'column' => 1,
                                                        'docs'   => false,
                                                    ]
                                                );
                                                ?>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="hp-col-xl full hp--adminMobile">
                                    <div class="hp-card">
                                        <div class="card-header">
                                            <div class="card-title"><?php echo __( 'Mobile', 'hp-admin' ) ?></div>
                                        </div>
                                        <div class="card-body">
                                            <div class="form-field">
                                                <?php 
                                                hp_render_field_settings(
                                                    [
                                                        'type'   => 'truefalse',
                                                        'name'   => $this->__field_name( 'mobile' ),
                                                        'id'     => $this->__field_name( 'mobile' ),
                                                        'value'  => $mobile,
                                                        'title'  => __( 'Ẩn/hiện', 'hp-admin' ),
                                                        'docs'   => false,
                                                    ]
                                                );
                                                ?>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="hp-col-xl full hp--adminMobile">
                                    <div class="hp-card">
                                        <div class="card-header">
                                            <div class="card-title"><?php echo __( 'Styling', 'hp-admin' ) ?></div>
                                        </div>
                                        <div class="card-body">
                                            <div class="form-field">
                                                <?php 
                                                hp_render_field_settings(
                                                    [
                                                        'type'        => 'text',
                                                        'name'        => $this->__field_name( 'bottom' ),
                                                        'id'          => $this->__field_name( 'bottom' ),
                                                        'value'       => $bottom,
                                                        'title'       => __( 'Margin/Bottom', 'hp-admin' ),
                                                        'placeholder' => __( 'Đơn vị thường dùng: px, rem, em', 'hp-admin' ),
                                                        'docs'        => false,
                                                    ]
                                                );
                                                ?>
                                            </div>
                                            <div class="form-field">
                                                <?php 
                                                hp_render_field_settings(
                                                    [
                                                        'type'        => 'text',
                                                        'name'        => $this->__field_name( 'leftright' ),
                                                        'id'          => $this->__field_name( 'leftright' ),
                                                        'value'       => $leftright,
                                                        'title'       => __( 'Margin/Left/Right', 'hp-admin' ),
                                                        'placeholder' => __( 'Đơn vị thường dùng: px, rem, em', 'hp-admin' ),
                                                        'docs'        => false,
                                                    ]
                                                );
                                                ?>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php 
        }

        protected function __get_button_icon( $button = [] )
        {
            if ( isset ( $button['icon'] ) && ! empty ( $button['icon'] ) ) {
                return wp_get_attachment_image( hp_get_image_id_by_url( $button['icon'] ), '42x42' );
            } else {
                return '<img src="'.get_template_directory_uri() . '/public/images/icon-location.png'.'" alt="button-icon-default">';
            }
        }

        protected function __get_button_label( $button = [] )
        {
            if ( isset ( $button['label'] ) && ! empty ( $button['label'] ) ) {
                return '<span>'.$button['label'].'</span>';
            } 
        }

        protected function __get_button_value( $button = [] )
        {
            if ( isset ( $button['value'] ) && ! empty ( $button['value'] ) ) {
                $btnType  = $button['type'];
                $btnValue = $button['value'];
                switch ( $btnType ) {
                    case 'phone':
                        return hp_replace_tel( $btnValue );
                        break;
                    case 'eamil':
                        return 'mailto:' . $btnValue;
                        break;
                    case 'zalo':
                        return esc_url( 'https://zalo.me/' . $btnValue );
                        break;
                    case 'link':
                        return esc_url( $btnValue );
                        break;
                    default:
                        return 'javascript:;';
                        break;
                }
            }  else {
                return 'javascript:;';
            }
        }

        protected function __get_button_attrs( $button = [] ) {
            $output = '';
            if ( isset ( $button['type'] ) && ! empty ( $button['type'] ) ) {
                $btnType   = $button['type'];
                $argsAttrs = [
                    'target' => 'blank',
                    'rel'    => 'nofollow external noopener noreferrer',
                ];
                if ( in_array ( $btnType, array( 'link', 'zalo' ) ) ) {
                    return $this->__mapped_html_attrs( $argsAttrs );
                } else {
                    return '';
                }
            }  else {
                return '';
            }
        }

        protected function __get_main_icon() {
            return '<img src="'.get_template_directory_uri().'/public/images/icon-call-user.svg" alt="button-icon-default">';
        }

        protected function __get_animated( $type = 'ring' ) {
            $output = '';
            if ( $type == 'ring' ) {
                $output .= '<div class="animated infinite zoomIn kenit-alo-circle"></div>';
                $output .= '<div class="animated infinite pulse kenit-alo-circle-fill"></div>';
            }
            return $output;
        }

        protected function __mapped_html_attrs( $argsAttrs ) {
            $output = '';
            if ( is_array ( $argsAttrs ) ) {
                foreach ( $argsAttrs as $katr => $attr ) {
                    $output .= ''.$katr.' = "'.$attr.'"' . ' ';
                }
            }
            return $output;
        }

        public function __front_template()
        {
            $active    = $this->__field_value( 'active', false );
            $desktop   = $this->__field_value( 'desktop', false );
            $mobile    = $this->__field_value( 'mobile', false );
            $float     = $this->__field_value( 'float', 'left' );
            $bottom    = $this->__field_value( 'bottom', '8rem' );
            $leftright = $this->__field_value( 'leftright', '2rem' );
            if ( !is_admin() && !$active ) {
                return;
            } elseif ( !is_admin() && !wp_is_mobile() AND !$desktop ) {
                return;
            } elseif ( !is_admin() && wp_is_mobile() AND !$mobile ) {
                return;
            }
            // get button
            $buttons = $this->__field_value( 'buttons', [] );
            if ( is_array ( $buttons ) && ! empty ( $buttons ) ) { 
                $classButtons = 'buttonsLeft';
                if ( $float == 'right' ) {
                    $classButtons = 'buttonsRight';
                }

                if ( wp_is_mobile() ) {
                    $classButtons .= ' buttonsMobile';
                } else {
                    $classButtons .= ' buttonsDesktop';
                }
            ?>
            <div class="support-online hp-call-buttons <?php echo $classButtons ?>">
                <div class="support-content"> 
                    <?php 
                    foreach ( $buttons as $kbtn => $button ) {
                        $btnType  = isset ( $button['type'] ) ? $button['type'] : 'text';
                        $disabled = isset ( $button['disabled'] ) ? $button['disabled'] : false;
                        $btnClass = 'button-live';
                        if ( $disabled ) {
                            $btnClass = 'button-disabled';
                        }
                        if ( !is_admin() && $disabled ) {
                            continue;
                        }

                    ?>
                    <a href="<?php echo $this->__get_button_value( $button ); ?>" 
                        class="call-now-item hp-call-item <?php echo $btnClass ?>" <?php echo $this->__get_button_attrs( $button ); ?>> 
                        <div class="btn-icon">
                            <?php echo $this->__get_button_icon( $button ); ?>
                        </div>
                        <?php 
                        // get animation ring
                        if ( in_array ( $btnType, array( 'phone' ) ) ) {
                            echo $this->__get_animated( 'ring' ); 
                        }
                        // get label
                        echo $this->__get_button_label( $button );
                        ?>
                    </a> 
                    <?php } ?>
                </div> 
                <div class="btn-support hp-call-support">
                    <?php echo $this->__get_animated( 'ring' ); ?>
                    <div class="btn-icon">
                        <?php echo $this->__get_main_icon(); ?>
                    </div>
                </div>
                <?php if ( !is_admin() ) { ?>
                <style type="text/css"> 
                .hp-call-buttons {
                    position: fixed;
                    z-index: 99;
                    bottom: <?php echo $bottom ?>;
                }

                .hp-call-buttons.buttonsLeft {
                    left: <?php echo $leftright ?>;
                    right: auto;
                }

                .hp-call-buttons.buttonsRight {
                    left: auto;
                    right: <?php echo $leftright ?>;
                }
                </style>
                <?php } ?>
            </div>
            <?php } 
        }

        public function __front_styles()
        {
            $active = $this->__field_value( 'active', false );
            if ( $active ) {
                // loading css
                wp_enqueue_style( 'hp-style-'.esc_attr( $this->page ).'-template', get_template_directory_uri() . '/public/css/hp-call-buttons.css', array(), $this->version );
                // loading js
                wp_enqueue_script( 'hp-script-'.esc_attr( $this->page ).'-template', get_template_directory_uri() . '/public/scripts/hp-call-buttons.js', array(), $this->version, true );
            }
        }

    }
}