<?php
class Hp_Admin
{
    public $version = THEME_VERSION;
    public $currentPage;
    public $admin_url;
    protected $page    = '';
    protected $menu    = MENU_FILTER_ADMIN;
    protected $setting = FILTER_ADMIN_SETTING;
    protected $pagehook;
    protected $callClass;

    public function __construct()
    {
        $this->currentPage = isset( $_GET['tab'] ) ? esc_attr( $_GET['tab'] ) : 'overview';
        if ( $this->currentPage === '' ) {
            $this->currentPage = 'overview';
        }
        $this->admin_url = get_admin_url() . 'themes.php?page=' . $this->menu;
        $pages           = $this->register_admin_pages();
        $this->callClass = $pages[ $this->currentPage ] ?? '';
    }

    /* ================================================================
       Bootstrap hooks
    ================================================================ */

    public function __init()
    {
        add_action( 'admin_menu',            [ $this, 'register_submenu' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'resgsiter_scripts' ] );
        add_action( 'admin_init',            [ $this, 'register_settings' ] );
    }

    public function register_admin_pages()
    {
        return apply_filters(
            'hp_theme_register_admin_pages',
            [
                'overview'   => $this->setting . 'Overview',
                'notfound'   => $this->setting . 'Not_Found',
                'buttons'    => $this->setting . 'Buttons',
                'comingsoon'  => $this->setting . 'Coming_Soon',
                'contentsync' => $this->setting . 'Content_Sync',
            ]
        );
    }

    public function register_submenu()
    {
        global $current_user;

        if ( $current_user->user_login === 'hpdev' ) {
            add_submenu_page(
                'themes.php',
                __( 'Cài đặt', 'hp-admin' ),
                __( 'Cài đặt', 'hp-admin' ),
                'manage_options',
                $this->menu,
                [ $this, 'resgsiter_template' ]
            );
        }

        if ( $current_user->user_login !== 'hpdev' ) {
            remove_menu_page( 'tools.php' );
            remove_submenu_page( 'options-general.php', 'options-privacy.php' );
            remove_submenu_page( 'index.php', 'update-core.php' );
            remove_all_actions( 'admin_notices' );
            add_filter( 'acf/settings/show_admin', '__return_false' );
            remove_menu_page( 'plugins.php' );
        }
    }

    public function resgsiter_scripts()
    {
        $uri = get_template_directory_uri() . '/core/admin/assets/';

        wp_enqueue_style( 'hp-style-global-template',   $uri . 'css/admin-global.css',   [], $this->version, 'all' );
        wp_enqueue_style( 'hp-style-toolbar-template',  $uri . 'css/admin-toolbar.css',  [], $this->version, 'all' );
        wp_enqueue_style( 'hp-style-styling-template',  $uri . 'css/admin-styling.css',  [], $this->version, 'all' );
        wp_enqueue_script( 'hp-script-global-template', $uri . 'js/admin-global.js',     [], $this->version, true );

        if ( class_exists( $this->callClass ) ) {
            ( new $this->callClass() )->__resgsiter_scripts();
        }

        if ( get_current_screen()->id === 'appearance_page_hp-filter-admin' ) {
            $settings = wp_enqueue_code_editor( [ 'type' => 'text/x-php' ] );
            if ( $settings ) {
                wp_add_inline_script(
                    'code-editor',
                    sprintf(
                        'jQuery( function() { wp.codeEditor.initialize( "header_script", %s ); } );',
                        wp_json_encode( $settings )
                    )
                );
            }
        }
    }

    public function register_settings()
    {
        foreach ( $this->register_admin_pages() as $className ) {
            if ( class_exists( $className ) ) {
                ( new $className() )->__resgsiter_settings();
            }
        }
    }

    public function resgsiter_template()
    {
        ?>
        <div id="hp-body-content">
            <?php require_once get_template_directory() . '/core/admin/partials/admin-header.php'; ?>

            <?php if ( class_exists( $this->callClass ) ) :
                $callBack = new $this->callClass();
            ?>
            <div class="hp-admin-headerbar">
                <h1><?php echo $callBack->__title(); ?></h1>
            </div>
            <div class="hp-admin-main">
                <div class="wrap">
                    <form id="hp-form-settings" method="POST" action="<?php echo $callBack->__action(); ?>">
                        <?php
                        if ( method_exists( $callBack, '__option_page' ) ) {
                            settings_fields( $callBack->__option_page() );
                            do_settings_sections( $callBack->__option_page() );
                            $this->update_options();
                        }
                        ?>
                        <div id="hp-main-template">
                            <?php $callBack->__template(); ?>
                        </div>
                        <?php require_once get_template_directory() . '/core/admin/partials/admin-footer.php'; ?>
                    </form>
                </div>
            </div>
            <?php endif; ?>
        </div>
        <?php
    }

    protected function update_options()
    {
        if ( ! isset( $_SERVER['REQUEST_METHOD'] ) || $_SERVER['REQUEST_METHOD'] !== 'POST' ) {
            return;
        }
        if ( ! class_exists( $this->callClass ) ) {
            return;
        }
        $callBack = new $this->callClass();
        foreach ( array_keys( $callBack->__resgsiter_options() ) as $key ) {
            update_option( $callBack->__option_name( $key ), $callBack->__get_submit_value( $key ) );
        }
    }

    /* ================================================================
       Shared helpers — inherited by all page subclasses.
       Each subclass MUST declare:  protected $page = 'pagename';
    ================================================================ */

    /**
     * Default admin script/style loader (standard pattern).
     * Subclasses may override when they need non-standard dependencies.
     */
    public function __resgsiter_scripts()
    {
        if ( empty( $this->page ) ) {
            return;
        }

        $base       = get_template_directory_uri() . '/core/admin/assets/';
        $handle_css = 'hp-style-'  . esc_attr( $this->page ) . '-template';
        $handle_js  = 'hp-script-' . esc_attr( $this->page ) . '-template';

        wp_enqueue_style(  $handle_css, $base . 'css/admin-' . esc_attr( $this->page ) . '.css', [], $this->version, 'all' );
        wp_enqueue_script( $handle_js,  $base . 'js/admin-'  . esc_attr( $this->page ) . '.js',  [], $this->version, true );
        wp_localize_script( $handle_js, 'Hp_Admin_ajax', [
            'ajaxURL'  => admin_url( 'admin-ajax.php' ),
            'adminURL' => get_admin_url(),
            'siteURL'  => get_site_url(),
        ] );
    }

    /** Define options for this page. Override per subclass. */
    public function __resgsiter_options()
    {
        return [];
    }

    /** Register all options returned by __resgsiter_options(). */
    public function __resgsiter_settings()
    {
        foreach ( $this->__resgsiter_options() as $key => $option ) {
            register_setting( $this->__option_page(), $this->__option_name( $key ), $option );
        }
    }

    /** Toolbar link URL for this page. */
    public function __link()
    {
        return esc_url( $this->admin_url ) . '&tab=' . $this->page;
    }

    /** CSS classes for the toolbar item. */
    public function __classes()
    {
        $classes = 'toolbar-menu-item';
        if ( $this->currentPage === $this->page ) {
            $classes .= ' current-page';
        }
        return esc_attr( $classes );
    }

    /** Form action URL (same as toolbar link). */
    public function __action()
    {
        return esc_url( $this->admin_url ) . '&tab=' . $this->page;
    }

    /** Build an HTML name attribute: page[field_key]. */
    public function __field_name( $name = '' )
    {
        if ( empty( $name ) ) {
            return '';
        }
        return $this->page . '[' . $this->__get_key( $name ) . ']';
    }

    /** Get a stored option value, with WP object-cache layer. */
    public function __field_value( $name = '', $default = false )
    {
        $cache_key = $this->__option_name( $name );
        $value     = wp_cache_get( $cache_key, $this->__option_page() );

        if ( false === $value ) {
            $value = get_option( $cache_key, $default );
            wp_cache_set( $cache_key, $value, $this->__option_page(), HOUR_IN_SECONDS );
        }

        return $value;
    }

    /** WP option key: HP_{page}_{field}. */
    public function __option_name( $name = '' )
    {
        if ( empty( $name ) ) {
            return '';
        }
        return 'HP_' . $this->page . '_' . $name;
    }

    /** WP settings page slug: HP_{page}. */
    public function __option_page()
    {
        return 'HP_' . $this->page;
    }

    /** Read a field value from the current POST request. */
    public function __get_submit_value( $name = '' )
    {
        if ( empty( $name ) ) {
            return false;
        }
        // phpcs:ignore WordPress.Security.NonceVerification
        return $_POST[ $this->page ][ $this->__get_key( $name ) ] ?? '';
    }

    /** Read a field value from a decoded formdata array. */
    public function __get_reuqest_value( $name = '', $formdata = [] )
    {
        if ( empty( $name ) ) {
            return false;
        }
        return $formdata[ $this->page ][ $this->__get_key( $name ) ] ?? '';
    }

    /** Sanitise a field/option key. */
    public function __get_key( $name = '' )
    {
        if ( empty( $name ) ) {
            return '';
        }
        return esc_attr( $name );
    }

    /** Nonce key for the settings form. */
    public function __nonce_key()
    {
        return $this->__option_page() . '-options';
    }
}
