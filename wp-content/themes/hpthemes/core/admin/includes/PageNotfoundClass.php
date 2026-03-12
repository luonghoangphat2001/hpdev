<?php
if ( ! class_exists( 'Hp_Admin' ) ) {
    return;
}

/**
 * Admin settings page: 404 Not Found
 *
 * Inherits all shared helpers from Hp_Admin.
 * Adds front-end helpers: __front_template(), __front_styles().
 */
class Hp_Setting_Not_Found extends Hp_Admin
{
    protected $page = 'notfound';

    /* ----------------------------------------------------------------
       Page identity
    ---------------------------------------------------------------- */

    public function __title()
    {
        return __( '404', 'hp-admin' );
    }

    public function __icon()
    {
        return '<span class="dashicons dashicons-admin-page"></span>';
    }

    /* ----------------------------------------------------------------
       Options schema
    ---------------------------------------------------------------- */

    public function __resgsiter_options()
    {
        return [
            'template' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => 'default',
            ],
        ];
    }

    /* ----------------------------------------------------------------
       Admin form template — template picker
    ---------------------------------------------------------------- */

    public function __template()
    {
        $template = $this->__field_value( 'template', 'default' );
        $img_base = get_template_directory_uri() . '/core/admin/assets/images/';

        $templates = [
            'default'  => [ 'label' => __( 'Mặc định', 'hp-admin' ), 'img' => $img_base . 'preview-image-notfound.jpg' ],
            '22052023' => [ 'label' => '22052023',                    'img' => $img_base . 'preview-image-notfound-22052023.jpg' ],
            '14092023' => [ 'label' => '14092023',                    'img' => $img_base . 'preview-image-notfound-14092023.png' ],
        ];
        ?>
        <div class="hp-row setN hp--adminNotfound">
            <?php foreach ( $templates as $value => $data ) : ?>
                <label class="hp-col-xl field-radio" id="<?php echo esc_attr( $this->__option_name( $value ) ); ?>">
                    <input type="radio"
                           id="<?php echo esc_attr( $this->__option_name( $value ) ); ?>"
                           name="<?php echo esc_attr( $this->__field_name( 'template' ) ); ?>"
                           class="form-radio"
                           value="<?php echo esc_attr( $value ); ?>"
                           <?php checked( $template, $value ); ?>>
                    <div class="hp-card">
                        <div class="card-header">
                            <div class="card-title"><?php echo esc_html( $data['label'] ); ?></div>
                        </div>
                        <div class="card-body">
                            <div class="form-field">
                                <div class="preview-image">
                                    <img src="<?php echo esc_url( $data['img'] ); ?>"
                                         alt="<?php echo esc_attr( $data['label'] ); ?>">
                                </div>
                            </div>
                        </div>
                    </div>
                </label>
            <?php endforeach; ?>
        </div>
        <?php
    }

    /* ----------------------------------------------------------------
       Front-end helpers (called from 404.php)
    ---------------------------------------------------------------- */

    /**
     * Render the selected 404 template partial.
     */
    public function __front_template()
    {
        $template = $this->__field_value( 'template', 'default' );
        ?>
        <div id="notfound_template" class="hp-notfound-template notfound-<?php echo esc_attr( $template ); ?>">
            <?php get_template_part( 'partials/templates/404/notfound', $template !== 'default' ? $template : false ); ?>
        </div>
        <?php
    }

    /**
     * Enqueue front-end stylesheet for the active 404 template.
     * Only 14092023 needs a CSS file — default and 22052023 use Tailwind.
     */
    public function __front_styles()
    {
        $template = $this->__field_value( 'template', 'default' );

        if ( $template === '14092023' ) {
            wp_enqueue_style(
                'hp-style-notfound-template',
                get_template_directory_uri() . '/public/css/404/notfound-14092023.css',
                [],
                $this->version
            );
        }
    }
}
