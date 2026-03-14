<?php
/**
 * Content Sync — Dev → Production
 *
 * Export: writes posts/pages/CPTs to data/wp-export/{post-type}.json
 * Import: reads those JSON files and upserts posts by slug.
 *         Triggered by a .sync-trigger file created by the deploy workflow.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/* ================================================================
   Constants
================================================================ */

define( 'HP_CONTENT_SYNC_EXPORT_DIR', ABSPATH . 'data/wp-export' );
define( 'HP_CONTENT_SYNC_TRIGGER',    get_template_directory() . '/.sync-trigger' );

/* ================================================================
   Auto-import on deploy (triggered by .sync-trigger file)
================================================================ */

add_action( 'init', function () {
    if ( ! file_exists( HP_CONTENT_SYNC_TRIGGER ) ) {
        return;
    }

    // Only run once — delete trigger immediately to prevent loops
    unlink( HP_CONTENT_SYNC_TRIGGER );

    HP_Content_Sync::import();
}, 5 );

/* ================================================================
   Core class
================================================================ */

class HP_Content_Sync
{
    /**
     * Post types to include in export/import.
     */
    public static function get_post_types()
    {
        $built_in = [ 'post', 'page' ];
        $custom   = get_post_types( [
            'public'   => true,
            '_builtin' => false,
        ], 'names' );

        // Exclude ACF field group post type
        unset( $custom['acf-field-group'], $custom['acf-field'] );

        return array_merge( $built_in, array_values( $custom ) );
    }

    /* ----------------------------------------------------------------
       Export
    ---------------------------------------------------------------- */

    public static function export()
    {
        $export_dir = HP_CONTENT_SYNC_EXPORT_DIR;

        if ( ! is_dir( $export_dir ) ) {
            wp_mkdir_p( $export_dir );
        }

        $post_types = self::get_post_types();
        $summary    = [];

        foreach ( $post_types as $post_type ) {
            $posts = get_posts( [
                'post_type'      => $post_type,
                'post_status'    => [ 'publish', 'draft', 'private' ],
                'posts_per_page' => -1,
                'orderby'        => 'menu_order date',
                'order'          => 'ASC',
            ] );

            $data = [];
            foreach ( $posts as $post ) {
                $data[] = self::serialize_post( $post );
            }

            $file = $export_dir . '/' . $post_type . '.json';
            file_put_contents( $file, wp_json_encode( [
                'post_type'   => $post_type,
                'exported_at' => current_time( 'c' ),
                'count'       => count( $data ),
                'posts'       => $data,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) );

            $summary[ $post_type ] = count( $data );
        }

        return $summary;
    }

    private static function serialize_post( WP_Post $post )
    {
        // Meta: skip internal WP keys
        $raw_meta = get_post_meta( $post->ID );
        $meta     = [];
        foreach ( $raw_meta as $key => $values ) {
            if ( substr( $key, 0, 1 ) === '_' ) {
                continue; // skip private/internal meta
            }
            $meta[ $key ] = count( $values ) === 1 ? $values[0] : $values;
        }

        // Taxonomy terms
        $taxonomies = get_object_taxonomies( $post->post_type );
        $terms      = [];
        foreach ( $taxonomies as $tax ) {
            $term_objects = get_the_terms( $post->ID, $tax );
            if ( $term_objects && ! is_wp_error( $term_objects ) ) {
                $terms[ $tax ] = wp_list_pluck( $term_objects, 'slug' );
            }
        }

        return [
            'post_title'   => $post->post_title,
            'post_name'    => $post->post_name,
            'post_content' => $post->post_content,
            'post_excerpt' => $post->post_excerpt,
            'post_status'  => $post->post_status,
            'menu_order'   => (int) $post->menu_order,
            'post_date'    => $post->post_date,
            'meta'         => $meta,
            'terms'        => $terms,
        ];
    }

    /* ----------------------------------------------------------------
       Import
    ---------------------------------------------------------------- */

    public static function import()
    {
        $export_dir = HP_CONTENT_SYNC_EXPORT_DIR;

        if ( ! is_dir( $export_dir ) ) {
            return;
        }

        $files = glob( $export_dir . '/*.json' );
        if ( empty( $files ) ) {
            return;
        }

        foreach ( $files as $file ) {
            $json = file_get_contents( $file );
            if ( ! $json ) {
                continue;
            }

            $data = json_decode( $json, true );
            if ( empty( $data['posts'] ) || empty( $data['post_type'] ) ) {
                continue;
            }

            foreach ( $data['posts'] as $item ) {
                self::upsert_post( $item, $data['post_type'] );
            }
        }
    }

    private static function upsert_post( array $item, $post_type )
    {
        if ( empty( $item['post_name'] ) ) {
            return;
        }

        // Look up existing post by slug + post_type
        $existing = get_posts( [
            'name'           => $item['post_name'],
            'post_type'      => $post_type,
            'post_status'    => 'any',
            'posts_per_page' => 1,
        ] );

        $post_data = [
            'post_title'   => $item['post_title']   ?? '',
            'post_name'    => $item['post_name'],
            'post_content' => $item['post_content'] ?? '',
            'post_excerpt' => $item['post_excerpt'] ?? '',
            'post_status'  => $item['post_status']  ?? 'publish',
            'menu_order'   => $item['menu_order']   ?? 0,
            'post_type'    => $post_type,
        ];

        if ( ! empty( $existing ) ) {
            $post_data['ID'] = $existing[0]->ID;
            $post_id = wp_update_post( $post_data );
        } else {
            $post_data['post_date'] = $item['post_date'] ?? current_time( 'mysql' );
            $post_id = wp_insert_post( $post_data );
        }

        if ( is_wp_error( $post_id ) || ! $post_id ) {
            return;
        }

        // Sync meta
        if ( ! empty( $item['meta'] ) && is_array( $item['meta'] ) ) {
            foreach ( $item['meta'] as $key => $value ) {
                update_post_meta( $post_id, $key, $value );
            }
        }

        // Sync taxonomy terms
        if ( ! empty( $item['terms'] ) && is_array( $item['terms'] ) ) {
            foreach ( $item['terms'] as $taxonomy => $slugs ) {
                $term_ids = [];
                foreach ( $slugs as $slug ) {
                    $term = get_term_by( 'slug', $slug, $taxonomy );
                    if ( $term ) {
                        $term_ids[] = $term->term_id;
                    }
                }
                if ( ! empty( $term_ids ) ) {
                    wp_set_object_terms( $post_id, $term_ids, $taxonomy );
                }
            }
        }
    }
}
