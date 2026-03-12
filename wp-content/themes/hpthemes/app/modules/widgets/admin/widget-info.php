<?php

/**
 * Undocumented class
 * Create widget
 */
class M_Contact_Information extends WP_Widget
{

    public $Hp_Widget;

    /**
     * Undocumented function
     */
    function __construct()
    {

        parent::__construct(
            'M_Contact_Information',
            __('HP - Contacts [footer]', 'HPmedia'),
            [
                'description' => __('To display contact information', 'HPmedia'),
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
        $icon                       = isset($instance['icon']) ? $instance['icon'] : '';
        $contact_information_list   = isset($instance['contact_information_list']) ? $instance['contact_information_list'] : '';
?>

        <?php if (is_array($contact_information_list) && !empty($contact_information_list)) { ?>

            <div class="footer-title"> <?php echo $title ?></div>
            <div class="footer-social">

                <div class="footer-info">
                    <?php if (is_array($contact_information_list) && !empty($contact_information_list)) { ?>
                        <?php
                        $countContactInformation = count($contact_information_list);
                        $countTemp = 1;
                        foreach ($contact_information_list as $key => $contact) { ?>
                            <?php if (empty($contact['url'])) { ?>
                                <p class="footer-info-item">
                                    <span class="icon">
                                        <img src="<?php echo $contact['title'] ?>" alt="">
                                    </span>
                                    <span class="txt">
                                        <?php echo $contact['content'] ?>
                                    </span>
                                </p>

                            <?php } else { ?>
                                <a class="footer-info-item" href="<?php echo $contact['url']; ?>" target="<?php echo $contact['target'] == 'yes' ? 1 : 0; ?>">
                                    <span class="icon">
                                        <img src="<?php echo $contact['title'] ?>" alt="">
                                    </span>
                                    <span class="txt">
                                        <?php echo $contact['content'] ?>
                                    </span>
                                </a>
                            <?php } ?>


                    <?php }
                    } ?>
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
                'title'       => __('Tiêu đề', 'HPmedia'),
                'placeholder' => __('Nhập nội dung văn bản', 'HPmedia'),
                'docs'        => false,
            ]
        );

        if (isset($instance['icon'])) {
            $icon = $instance['icon'];
        } else {
            $icon = '';
        }

        Hp_Widget::create_field(
            [
                'type'        => 'image',
                'name'        => $this->get_field_name('icon'),
                'id'          => $this->get_field_id('icon'),
                'value'       => $icon,
                'title'       => __('Icon', 'HPmedia'),
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
                'title'       => __('Danh sách thông tin liên lạc', 'HPmedia'),
                'fields' => [
                    'title' => [
                        'type'              => 'image',
                        'title'             => __('Icon', 'HPmedia'),
                    ],
                    'content' => [
                        'type'              => 'textarea',
                        'title'             => __('Content', 'HPmedia'),
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
        $instance['icon'] = Hp_Widget::update_field($new_instance['icon']);
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
function M_Contact_Information()
{
    register_widget('M_Contact_Information');
}
add_action('widgets_init', 'M_Contact_Information');
