<?php 
require_once( get_template_directory() . CORE_PATH . '/config.php' );
require_once( get_template_directory() . ADMIN_PATH . '/class-hp-admin.php' );
require_once( get_template_directory() . ADMIN_PATH . '/class-hp-page-login.php' );
require_once( get_template_directory() . CORE_PATH . '/classes/class-hp-setup.php' );
require_once( get_template_directory() . CORE_PATH . '/classes/class-hp-core.php' );

spl_autoload_register(
    function ( $className ) {
        $classPath = get_template_directory() . CONTROLLER_PATH . '/'.$className.'.php';
        if ( is_readable( $classPath ) ) {
            require_once( $classPath );
        }
    }
);

$moduleWidgets = glob( get_template_directory() . MODULE_PATH . '/widgets/*.php' );
foreach ( $moduleWidgets as $filePath ) {
    require_once( $filePath );
}

$ajaxFiles = glob( get_template_directory() . AJAX_PATH . '/*.php' );
foreach ( $ajaxFiles as $filePath ) {
    require_once( $filePath );
}

$ajaxFiles = glob( get_template_directory() . HELPER_PATH . '/*.php' );
foreach ( $ajaxFiles as $filePath ) {
    require_once( $filePath );
}

// core theme
if ( class_exists ( 'Hp_Core' ) ) {
    $Core = new Hp_Core();
    $Core->load_core();
}

// admin setting
if ( class_exists ( 'Hp_Admin' ) ) {

    require_once( get_template_directory() . ADMIN_PATH . '/functions.php' );

    $includeFiles = glob( get_template_directory() . ADMIN_INCLUDES_PATH . '/*.php' );
    foreach ( $includeFiles as $filePath ) {
        require_once( $filePath );
    }

    $ajaxFiles = glob( get_template_directory() . ADMIN_AJAX_PATH . '/*.php' );
    foreach ( $ajaxFiles as $filePath ) {
        require_once( $filePath );
    }

    $Admin = new Hp_Admin();
    $Admin->__init();

}
