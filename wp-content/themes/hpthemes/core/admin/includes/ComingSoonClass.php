<?php
if ( ! class_exists( 'Hp_Admin' ) ) {
    return;
}

/**
 * Admin settings page: Coming Soon
 *
 * Inherits all shared helpers from Hp_Admin:
 *   __link, __classes, __action, __field_name, __field_value,
 *   __option_name, __option_page, __get_submit_value,
 *   __get_reuqest_value, __get_key, __nonce_key,
 *   __resgsiter_settings, __resgsiter_scripts
 */
class Hp_Setting_Coming_Soon extends Hp_Admin
{
    protected $page = 'comingsoon';

    /* ----------------------------------------------------------------
       Page identity
    ---------------------------------------------------------------- */

    public function __title()
    {
        return __( 'Coming Soon', 'hp-admin' );
    }

    public function __icon()
    {
        return '<span class="dashicons dashicons-admin-tools"></span>';
    }

    /* ----------------------------------------------------------------
       Options schema
    ---------------------------------------------------------------- */

    public function __resgsiter_options()
    {
        return [
            'active' => [
                'type'              => 'boolean',
                'sanitize_callback' => null,
                'default'           => false,
            ],
            'title' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ],
            'description' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ],
            'dealine' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ],
            'disabledisadmin' => [
                'type'              => 'boolean',
                'sanitize_callback' => null,
                'default'           => true,
            ],
        ];
    }

    /* ----------------------------------------------------------------
       Admin form template
    ---------------------------------------------------------------- */

    public function __template()
    {
        $active          = $this->__field_value( 'active', false );
        $title           = $this->__field_value( 'title', __( 'Coming Soon', 'hp-admin' ) );
        $description     = $this->__field_value( 'description', '' );
        $dealine         = $this->__field_value( 'dealine', '' );
        $disabledisadmin = $this->__field_value( 'disabledisadmin', true );
        ?>
        <div class="hp-row setN wrap-sticky">
            <div class="hp-col-xl full hp--adminComingSoon">
                <div class="hp-card">
                    <div class="card-header">
                        <div class="card-title"><?php _e( 'Cài đặt chung', 'hp-admin' ); ?></div>
                    </div>
                    <div class="card-body">
                        <div class="hp-row hp--subCard">
                            <div class="hp-col-xl">
                                <div class="form-field">
                                    <?php
                                    hp_render_field_settings( [
                                        'type'  => 'truefalse',
                                        'name'  => $this->__field_name( 'active' ),
                                        'id'    => $this->__field_name( 'active' ),
                                        'value' => $active,
                                        'title' => __( 'Kích hoạt', 'hp-admin' ),
                                        'docs'  => false,
                                    ] );

                                    hp_render_field_settings( [
                                        'type'  => 'text',
                                        'name'  => $this->__field_name( 'title' ),
                                        'id'    => $this->__field_name( 'title' ),
                                        'value' => $title,
                                        'title' => __( 'Tiêu đề', 'hp-admin' ),
                                        'docs'  => false,
                                    ] );

                                    hp_render_field_settings( [
                                        'type'  => 'textarea',
                                        'name'  => $this->__field_name( 'description' ),
                                        'id'    => $this->__field_name( 'description' ),
                                        'value' => $description,
                                        'title' => __( 'Mô tả ngắn', 'hp-admin' ),
                                        'docs'  => false,
                                    ] );
                                    ?>

                                    <div class="hp-widget-items render-field box-field-date">
                                        <div class="box-field-title">
                                            <label for="<?php echo esc_attr( $this->__field_name( 'dealine' ) ); ?>" class="txt-label field-date-label">
                                                <?php _e( 'Deadline', 'hp-admin' ); ?>
                                            </label>
                                        </div>
                                        <div class="box-field-content">
                                            <input type="date"
                                                   class="hp-custom-widget ref-field-date"
                                                   id="<?php echo esc_attr( $this->__field_name( 'dealine' ) ); ?>"
                                                   name="<?php echo esc_attr( $this->__field_name( 'dealine' ) ); ?>"
                                                   value="<?php echo esc_attr( $dealine ); ?>">
                                        </div>
                                    </div>

                                    <?php
                                    hp_render_field_settings( [
                                        'type'  => 'truefalse',
                                        'name'  => $this->__field_name( 'disabledisadmin' ),
                                        'id'    => $this->__field_name( 'disabledisadmin' ),
                                        'value' => $disabledisadmin,
                                        'title' => __( 'Không hiển thị với vai trò Admin', 'hp-admin' ),
                                        'docs'  => false,
                                    ] );
                                    ?>
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
