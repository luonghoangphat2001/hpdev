<?php
class WidgetDefaultText extends WP_Widget {

    function __construct() 
    {
        parent::__construct(
            'm_default_text',
            __( 'HP - Default Text', 'hp-admin' ),
            [
                'description' => __( 'Hiển thị nhập giá trị văn bản ngắn', 'hp-admin' ),
            ]
        );
    }

    public function widget( $args, $instance ) 
    {
        $widget_id = $args['widget_id'];
        $title = isset( $instance['title'] ) ? $instance['title'] : '';
        ?>
        <div class="hp-ft-text-default">
            <p><?php echo esc_attr( $title ) ?></p>
        </div>
        <?php
    }

    public function form( $instance ) 
    {
        if ( isset( $instance[ 'title' ] ) ) {
            $title = $instance[ 'title' ];
        } else {
            $title = '';
        }

        if ( class_exists ( 'Hp_Widget' ) ) {
            hp_render_field_settings(
                [
                    'type'        => 'text',
                    'name'        => $this->get_field_name( 'title' ),
                    'id'          => $this->get_field_id( 'title' ),
                    'value'       => $title,
                    'title'       => __( 'Text', 'hp-admin' ),
                    'placeholder' => __( 'Nhập nội dung văn bản', 'hp-admin' ),
                    'docs'        => false,
                ]
            );
        }
    }

    public function update( $new_instance, $old_instance ) 
    {
        $instance = [];
        if ( class_exists ( 'Hp_Widget' ) ) { 
            $instance['title'] = hp_update_field_settings( $new_instance['title'] );
        }
        return $instance;
    }

}

add_action( 'widgets_init', function() {
    register_widget( 'WidgetDefaultText' );
});