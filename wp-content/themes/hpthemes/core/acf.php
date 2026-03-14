<?php
/**
 * ACF Local JSON Sync
 *
 * Saves ACF field group definitions as JSON files in acf-json/ when created or edited.
 * On deployment, production loads these JSON files to sync field groups automatically.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Tell ACF where to save JSON files when a field group is saved/updated.
 */
add_filter( 'acf/settings/save_json', function ( $path ) {
    return get_stylesheet_directory() . '/acf-json';
} );

/**
 * Tell ACF where to load JSON files from (supports multiple paths).
 */
add_filter( 'acf/settings/load_json', function ( $paths ) {
    $paths[] = get_stylesheet_directory() . '/acf-json';
    return $paths;
} );
