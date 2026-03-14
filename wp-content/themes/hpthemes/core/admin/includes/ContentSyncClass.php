<?php
if ( ! class_exists( 'Hp_Admin' ) ) {
    return;
}

class HP_Setting_Content_Sync extends Hp_Admin
{
    protected $page = 'contentsync';

    public function __title()
    {
        return __( 'Content Sync', 'hp-admin' );
    }

    public function __icon()
    {
        return '<span class="dashicons dashicons-database-export"></span>';
    }

    public function __resgsiter_options()
    {
        return [];
    }

    public function __resgsiter_scripts()
    {
        wp_localize_script( 'hp-script-global-template', 'Hp_ContentSync', [
            'ajaxURL' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'hp_content_sync_nonce' ),
        ] );
    }

    public function __template()
    {
        $post_types = class_exists( 'HP_Content_Sync' ) ? HP_Content_Sync::get_post_types() : [];
        $export_dir = HP_CONTENT_SYNC_EXPORT_DIR;
        $last_export = '';

        // Check last export time from any json file
        $files = is_dir( $export_dir ) ? glob( $export_dir . '/*.json' ) : [];
        if ( ! empty( $files ) ) {
            $times = array_map( 'filemtime', $files );
            $last_export = date( 'H:i:s d/m/Y', max( $times ) );
        }
        ?>
        <div class="hp-row setN wrap-sticky">
            <div class="hp-col-xl full">
                <div class="hp-card">
                    <div class="card-header">
                        <div class="card-title"><?php _e( 'Export Content', 'hp-admin' ); ?></div>
                    </div>
                    <div class="card-body">
                        <div class="hp-row hp--subCard">
                            <div class="hp-col-xl">
                                <p style="margin-bottom:12px;color:#555;">
                                    <?php _e( 'Xuất toàn bộ posts/pages/CPTs ra file JSON trong thư mục <code>data/wp-export/</code>. Commit + push để production tự động sync khi deploy.', 'hp-admin' ); ?>
                                </p>

                                <?php if ( ! empty( $post_types ) ) : ?>
                                <p style="margin-bottom:16px;">
                                    <strong><?php _e( 'Post types sẽ được export:', 'hp-admin' ); ?></strong>
                                    <span style="margin-left:8px;color:#0073aa;"><?php echo esc_html( implode( ', ', $post_types ) ); ?></span>
                                </p>
                                <?php endif; ?>

                                <?php if ( $last_export ) : ?>
                                <p style="margin-bottom:16px;color:#666;">
                                    <?php _e( 'Export gần nhất:', 'hp-admin' ); ?>
                                    <strong id="hp-sync-last-export"><?php echo esc_html( $last_export ); ?></strong>
                                </p>
                                <?php else : ?>
                                <p style="margin-bottom:16px;color:#999;" id="hp-sync-last-export-wrap">
                                    <?php _e( 'Chưa có export nào.', 'hp-admin' ); ?>
                                </p>
                                <?php endif; ?>

                                <button type="button" id="hp-btn-export-content" class="button button-primary" style="margin-bottom:16px;">
                                    <span class="dashicons dashicons-database-export" style="vertical-align:middle;margin-top:-2px;"></span>
                                    <?php _e( 'Export ngay', 'hp-admin' ); ?>
                                </button>

                                <div id="hp-sync-result" style="display:none;padding:10px 14px;border-radius:4px;margin-top:8px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="hp-card" style="margin-top:20px;">
                    <div class="card-header">
                        <div class="card-title"><?php _e( 'Hướng dẫn deploy', 'hp-admin' ); ?></div>
                    </div>
                    <div class="card-body">
                        <div class="hp-row hp--subCard">
                            <div class="hp-col-xl">
                                <ol style="margin-left:20px;color:#444;line-height:2;">
                                    <li><?php _e( 'Nhấn <strong>Export ngay</strong> để tạo file JSON trong <code>data/wp-export/</code>', 'hp-admin' ); ?></li>
                                    <li><?php _e( 'Commit toàn bộ file JSON: <code>git add data/wp-export/ && git commit -m "Sync content"</code>', 'hp-admin' ); ?></li>
                                    <li><?php _e( 'Push: <code>git push origin main</code>', 'hp-admin' ); ?></li>
                                    <li><?php _e( 'GitHub Actions deploy → production tự động import khi load trang đầu tiên', 'hp-admin' ); ?></li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
        (function($){
            $('#hp-btn-export-content').on('click', function(){
                var $btn    = $(this);
                var $result = $('#hp-sync-result');

                $btn.prop('disabled', true).text('<?php _e( 'Đang export...', 'hp-admin' ); ?>');
                $result.hide();

                $.post(Hp_ContentSync.ajaxURL, {
                    action: 'hp_export_content',
                    nonce:  Hp_ContentSync.nonce
                }, function(res){
                    $btn.prop('disabled', false).html(
                        '<span class="dashicons dashicons-database-export" style="vertical-align:middle;margin-top:-2px;"></span> <?php _e( 'Export ngay', 'hp-admin' ); ?>'
                    );

                    if(res.success){
                        $result.css({background:'#d4edda',color:'#155724',border:'1px solid #c3e6cb'})
                               .html('<strong>' + res.data.message + '</strong><br>' + res.data.summary.join('<br>') + '<br><small><?php _e( 'Lúc:', 'hp-admin' ); ?> ' + res.data.time + '</small>')
                               .show();
                        $('#hp-sync-last-export').text(res.data.time);
                        $('#hp-sync-last-export-wrap').hide();
                    } else {
                        $result.css({background:'#f8d7da',color:'#721c24',border:'1px solid #f5c6cb'})
                               .html('<strong>Lỗi:</strong> ' + (res.data.message || 'Unknown error'))
                               .show();
                    }
                }).fail(function(){
                    $btn.prop('disabled', false);
                    $result.css({background:'#f8d7da',color:'#721c24',border:'1px solid #f5c6cb'})
                           .html('<strong>Lỗi kết nối AJAX.</strong>')
                           .show();
                });
            });
        })(jQuery);
        </script>
        <?php
    }
}
