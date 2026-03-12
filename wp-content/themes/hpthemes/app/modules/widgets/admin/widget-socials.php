<?php

/**
 * Undocumented class
 * Create widget
 */
class M_Socials extends WP_Widget
{

    public $Hp_Widget;

    /**
     * Undocumented function
     */
    function __construct()
    {

        parent::__construct(
            'M_Socials',
            __('HP - Socials [footer]', 'HPmedia'),
            [
                'description' => __('To display socials information', 'HPmedia'),
            ]
        );

        // $this->Hp_Widget = new HP_Exs_Widgets();
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
        $contact_information_list   = isset($instance['contact_information_list']) ? $instance['contact_information_list'] : '';
?>

        <?php if (is_array($contact_information_list) && !empty($contact_information_list)) { ?>
            <div class="ft-box">
                <div class="ft-box-head">
                    <span class="t-text">
                        <?php echo $title; ?>
                    </span>
                </div>
                <div class="ft-sc-list">
                    <?php
                    $countContactInformation = count($contact_information_list);
                    $countTemp = 1;
                    foreach ($contact_information_list as $key => $contact) { ?>
                        <?php if (empty($contact['url'])) { ?>
                            <p class="social-link i-link">
                                <img src="<?php echo $contact['icon']; ?>" alt="">
                            </p>
                        <?php } else { ?>
                            <a href="<?php echo $contact['url']; ?>" target="<?php echo $contact['target'] == 'yes' ? 1 : 0; ?>" class="i-link">
                                <img src="<?php echo $contact['icon']; ?>" alt="">
                            </a>
                        <?php } ?>
                    <?php } ?>
                </div>
            </div>
        <?php } ?>

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
                'title'       => __('Title', 'HPmedia'),
                'placeholder' => __('Enter your title', 'HPmedia'),
                'docs'        => false,
            ]
        );

        if (isset($instance['contact_information_list'])) {
            $contact_information_list = $instance['contact_information_list'];
        } else {
            $contact_information_list = '';
        }

        Hp_Widget::create_field(
            [
                'type'        => 'repeater',
                'name'        => $this->get_field_name('contact_information_list'),
                'id'          => $this->get_field_id('contact_information_list'),
                'value'       => $contact_information_list,
                'title'       => __('Socials', 'HPmedia'),
                'fields' => [
                    'icon' => [
                        'type'              => 'image',
                        'title'             => __('Icon', 'HPmedia'),
                    ],
                    'url' => [
                        'type'              => 'textarea',
                        'title'             => __('Attachment Link', 'HPmedia'),
                    ],
                    'target' => [
                        'type'              => 'radio',
                        'title'             => __('Target', 'HPmedia'),
                        'radio' => [
                            'no'  => __('Không', 'HPmedia'),
                            'yes'  => __('Có', 'HPmedia'),
                        ],
                    ],
                ],
                'docs'   => false,
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
        $instance['contact_information_list'] = Hp_Widget::update_field($new_instance['contact_information_list']);

        return $instance;
    }
}

/**
 * Undocumented function
 *
 * Register and load the widget
 * @return void
 */
function M_Socials()
{
    register_widget('M_Socials');
}
add_action('widgets_init', 'M_Socials');
