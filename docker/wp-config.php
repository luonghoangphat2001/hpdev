<?php
define('WP_HOME', getenv('WP_HOME') ?: 'http://localhost:8080/hpdevdemo');
define('WP_SITEURL', getenv('WP_SITEURL') ?: 'http://localhost:8080/hpdevdemo');

define('DB_NAME', getenv('WORDPRESS_DB_NAME') ?: 'hpdevdemo');
define('DB_USER', getenv('WORDPRESS_DB_USER') ?: 'hpdevdemo');
define('DB_PASSWORD', getenv('WORDPRESS_DB_PASSWORD') ?: 'hpdevdemo');
define('DB_HOST', getenv('WORDPRESS_DB_HOST') ?: 'db:3306');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

define('AUTH_KEY', 'hpdevdemo-auth-key');
define('SECURE_AUTH_KEY', 'hpdevdemo-secure-auth-key');
define('LOGGED_IN_KEY', 'hpdevdemo-logged-in-key');
define('NONCE_KEY', 'hpdevdemo-nonce-key');
define('AUTH_SALT', 'hpdevdemo-auth-salt');
define('SECURE_AUTH_SALT', 'hpdevdemo-secure-auth-salt');
define('LOGGED_IN_SALT', 'hpdevdemo-logged-in-salt');
define('NONCE_SALT', 'hpdevdemo-nonce-salt');

$table_prefix = getenv('WORDPRESS_TABLE_PREFIX') ?: 'hp_';

define('WP_DEBUG', filter_var(getenv('WP_DEBUG') ?: 'true', FILTER_VALIDATE_BOOL));
define('WP_DEBUG_LOG', filter_var(getenv('WP_DEBUG_LOG') ?: 'true', FILTER_VALIDATE_BOOL));
define('WP_DEBUG_DISPLAY', filter_var(getenv('WP_DEBUG_DISPLAY') ?: 'false', FILTER_VALIDATE_BOOL));

if (!defined('ABSPATH')) {
	define('ABSPATH', dirname(__FILE__) . '/');
}

require_once ABSPATH . 'wp-settings.php';
