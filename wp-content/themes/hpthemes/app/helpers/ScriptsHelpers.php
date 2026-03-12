<?php 
function do_config_enqueue_scripts( $form = '' ) {
    if ( empty ( $form ) ) {
        return;
    }
    
    if ( $form == 'themes' ) {
        $url = HP_THEME_PATH;
    }
    
    $incStyles = isset ( $GLOBALS['config'][$form]['includes'] ) ? $GLOBALS['config'][$form]['includes'] : [];
    if ( is_array ( $incStyles ) ) {
        foreach ( $incStyles as $key => $styles ) {
            switch ( $key ) {
                case 'styles':
                    if ( is_array ( $styles ) ) {
                        foreach ( $styles as $path => $value ) {

                            if ( is_single() ) {
                                if ( isset ( $value['exclude']['post_ids'] ) && ! empty ( $value['exclude']['post_ids'] ) ) {
                                    if ( ! scripts_exclude_id( $value['exclude']['post_ids'] ) ) {
                                        continue;
                                    }
                                }
                            }

                            if ( isset ( $value['exclude']['post_types'] ) && ! empty ( $value['exclude']['post_types'] ) ) {
                                if ( ! scripts_exclude_type( $value['exclude']['post_types'] ) ) {
                                    continue;
                                }
                            }

                            if ( is_tax() ) {
                                if ( isset ( $value['exclude']['taxonomys'] ) && ! empty ( $value['exclude']['taxonomys'] ) ) {
                                    if ( ! scripts_exclude_tax( $value['exclude']['taxonomys'] ) ) {
                                        continue;
                                    }
                                }
                            }

                            wp_enqueue_style( 'hp-' . $value['name'], $url . $path, array(), THEME_VERSION );
                        }
                    }
                    break;
                case 'scripts':
                    if ( is_array ( $styles ) ) {
                        foreach ( $styles as $path => $value ) {

                            if ( is_single() ) {
                                if ( isset ( $value['exclude']['post_ids'] ) && ! empty ( $value['exclude']['post_ids'] ) ) {
                                    if ( ! scripts_exclude_id( $value['exclude']['post_ids'] ) ) {
                                        continue;
                                    }
                                }
                            }

                            if ( isset ( $value['exclude']['post_types'] ) && ! empty ( $value['exclude']['post_types'] ) ) {
                                if ( ! scripts_exclude_type( $value['exclude']['post_types'] ) ) {
                                    continue;
                                }
                            }

                            if ( is_tax() ) {
                                if ( isset ( $value['exclude']['taxonomys'] ) && ! empty ( $value['exclude']['taxonomys'] ) ) {
                                    if ( ! scripts_exclude_tax( $value['exclude']['taxonomys'] ) ) {
                                        continue;
                                    }
                                }
                            }

                            wp_enqueue_script( 'hp-' . $value['name'], $url . $path, array(), THEME_VERSION, true );
                        }
                    }
                    break;
            }
        }
    }
}

/**
 * Enqueue multiple page-specific assets in one call.
 * Assets are grouped internally by priority → one add_action per distinct priority.
 *
 * Usage:
 *   hp_enqueue_page_assets( [
 *       'js' => [
 *           'scroll-section' => [ 'path' => 'public/scripts/ScrollSectionModule.js', 'deps' => [ 'jquery' ], 'priority' => 10 ],
 *       ],
 *       'css' => [
 *           'project-css' => [ 'path' => 'public/css/pages/project.css', 'deps' => [ 'hp-frontend' ] ],
 *       ],
 *   ] );
 *
 * Asset keys: 'path' (required), 'deps' (default []), 'ver' (default THEME_VERSION),
 *             'priority' (default $default_priority, i.e. 25),
 *             'args' (CSS: media string; JS: in_footer bool, default true).
 *
 * @param array $assets           Grouped array: [ 'css' => [...], 'js' => [...] ]
 * @param int   $default_priority Fallback priority for assets without a 'priority' key.
 */
function hp_enqueue_page_assets( array $assets, int $default_priority = 25 ) {
    // Group assets by their individual priority.
    $by_priority = [];
    foreach ( $assets as $type => $items ) {
        foreach ( $items as $handle => $asset ) {
            $p = $asset['priority'] ?? $default_priority;
            $by_priority[ $p ][ $type ][ $handle ] = $asset;
        }
    }

    foreach ( $by_priority as $priority => $grouped ) {
        add_action( 'wp_enqueue_scripts', function () use ( $grouped ) {
            foreach ( $grouped as $type => $items ) {
                foreach ( $items as $handle => $asset ) {
                    $src  = HP_THEME_PATH . '/' . ltrim( $asset['path'], '/' );
                    $deps = $asset['deps'] ?? [];
                    $ver  = $asset['ver']  ?? THEME_VERSION;

                    if ( $type === 'css' ) {
                        wp_enqueue_style( 'hp-' . $handle, $src, $deps, $ver, $asset['args'] ?? 'all' );
                    } else {
                        wp_enqueue_script( 'hp-' . $handle, $src, $deps, $ver, $asset['args'] ?? true );
                    }
                }
            }
        }, $priority );
    }
}

function scripts_exclude_id( $excludes = [], $post_id = '' ) {
    if ( empty ( $excludes ) ) {
        return false;
    }

    if ( empty ( $post_id ) ) {
        $post_id = get_the_ID();
    }

    if ( in_array ( $post_id, $excludes ) ) {
        return true;
    } else {
        return false;
    }
}

function scripts_exclude_type( $excludes = [], $post_id = '' ) {
    if ( empty ( $excludes ) ) {
        return false;
    }

    if ( empty ( $post_id ) ) {
        $post_id = get_the_ID();
    }

    if ( is_home() ) {
        $post_id = HP_PAGE_HOME;
    }

    $post_type = get_post_type( $post_id );
    if ( empty ( $post_type ) ) {
        return false;
    }

    if ( in_array ( $post_type, $excludes ) ) {
        return true;
    } else {
        return false;
    }
}

function scripts_exclude_tax( $excludes = [], $taxonomy = '' ) {
    if ( empty ( $excludes ) ) {
        return false;
    }

    if ( empty ( $taxonomy ) ) {
        $taxonomy = get_queried_object();
    }

    $tax_name = $taxonomy->taxonomy_name;
    if ( empty ( $tax_name ) ) {
        return false;
    }

    if ( in_array ( $tax_name, $excludes ) ) {
        return true;
    } else {
        return false;
    }
}
