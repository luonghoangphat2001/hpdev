<?php

/**
 * Undocumented class
 * Create widget
 */
class M_shortcode extends WP_Widget
{

    public $Hp_Widget;

    /**
     * Undocumented function
     */
    function __construct()
    {

        parent::__construct(
            'M_shortcode',
            __('HP - shortcode', 'hpdev'),
            [
                'description' => __('To display contact information', 'hpdev'),
            ]
        );

        // $this->Hp_Widget = new Mona_Exs_Widgets();
    }

    /**
     * Undocumented function
     *
     * @param [type] $args
     * @param [type] $instance
     * @return void
     */
    public function widget($args, $instance)
    {

        $widget_id      = $args['widget_id'];
        $title                      = isset($instance['title']) ? $instance['title'] : '';

?>

        <div class="mona-shortcode">
            <?php echo do_shortcode($title) ?>
        </div>

<?php
    }

    /**
     * Undocumented function
     *
     * Widget Backend
     * @param [type] $instance
     * @return void
     */
    public function form($instance)
    {

        if (isset($instance['title'])) {
            $title = $instance['title'];
        } else {
            $title = '';
        }

        Hp_Widget::create_field(
            [
                'type'        => 'text',
                'name'        => $this->get_field_name('title'),
                'id'          => $this->get_field_id('title'),
                'value'       => $title,
                'title'       => __('Text', 'hpdev'),
                'placeholder' => __('Nhập mã shortcode', 'hpdev'),
                'docs'        => false,
            ]
        );
    }

    /**
     * Undocumented function
     *
     * Updating widget replacing old instances with new
     * @param [type] $new_instance
     * @param [type] $old_instance
     * @return void
     */
    public function update($new_instance, $old_instance)
    {

        $instance = [];
        $instance['title'] = Hp_Widget::update_field($new_instance['title']);


        return $instance;
    }
}

/**
 * Undocumented function
 *
 * Register and load the widget
 * @return void
 */
function M_shortcode()
{
    register_widget('M_shortcode');
}
add_action('widgets_init', 'M_shortcode');
