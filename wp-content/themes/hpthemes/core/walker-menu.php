<?php
class Hp_Walker_Nav_Menu extends Walker_Nav_Menu
{

    function start_lvl(&$output, $depth = 0, $args = array())
    {
        $indent = str_repeat("\t", $depth);
        $output .= "\n$indent<ul class='menu-list'>\n";
    }

    function end_lvl(&$output, $depth = 0, $args = array())
    {
        $indent = str_repeat("\t", $depth);
        $output .= "$indent</ul>\n";
    }

    function start_el(&$output, $item, $depth = 0, $args = array(), $id = 0)
    {
        $object = $item->object;
        $type = $item->type;
        $title = $item->title;
        $description = $item->description;
        $permalink = $item->url;
        $hp_menu_icon = get_field('hp_menu_icon', $item);
        $check_mega_menu = get_field('mega_menu_check', $item);
        $mega_menu = get_field('hp_mega_menu', $item);
        $output .= "<li class='parent fz16 fw6" . ($check_mega_menu ? ' dropdown ' : ' ') .  implode(" ", $item->classes) . "'>";

        //Add SPAN if no Permalink
        if ($permalink && $permalink != '#') {
            $output .= '<a class="menu-link" href="' . $permalink . '">';
        } else {
            $output .= '<a class="menu-link" href="javascript:;">';
        }

        $output .= $title;
        if (!empty($hp_menu_icon)) {
            $output .= '<span class="icon">' . wp_get_attachment_image($hp_menu_icon, 'full') . '</span>';
        }
        if ($args->walker->has_children) {
            $output .= '<i class="fas fa-arrow-down"></i>';
        }
        if ($permalink && $permalink != '#') {
            $output .= '</a>';
        } else {
            $output .= '</a>';
        }


        if ($check_mega_menu && content_exists($mega_menu)) {
            $output .= self::MenuMegaContent($mega_menu);
        }
    }

    function MenuMegaContent($mega_menu)
    {
        ob_start();
?>
        <div class="hd-cate-pos">
            <div class="hd-cate-wrap">
                <div class="hd-cate-flex">
                    <div class="hd-cate-left">
                        <div class="hd-cate-box">
                            <div class="hd-cate-ul">
                                <?php if (!empty($mega_menu['repeater'])) {
                                    foreach ($mega_menu['repeater'] as $ey => $item) {
                                        $term = get_term($item['taxonomy_parent'], 'product_cat');
                                ?>
                                        <div class="hd-cate-li">
                                            <div class="hd-cate-ihead">
                                                <a class="t-link" href="<?php echo get_term_link($term) ?>">
                                                    <?php echo $term->name ?>
                                                </a>
                                                <a class="btn" href="<?php echo get_term_link($term) ?>">
                                                    <span class="inner">Xem tất cả</span>
                                                    <i class="fal fa-arrow-right icon"></i>
                                                </a>
                                            </div>
                                            <div class="hd-cate-nav">
                                                <div class="hd-cate-navs">
                                                    <?php if (!empty($item['taxonomy_child'])) {
                                                        foreach ($item['taxonomy_child'] as $ey => $item) {
                                                            $child = get_term($item, 'product_cat');
                                                            $thumbnail_id = get_term_meta($item, 'thumbnail_id', true);
                                                    ?>
                                                            <div class="hd-cate-col">
                                                                <div class="hd-cate-igr">
                                                                    <div class="inner-image">
                                                                        <a class="inner" href="<?php echo get_term_link($item) ?>">
                                                                            <?php echo wp_get_attachment_image($thumbnail_id, 'full') ?>
                                                                        </a>
                                                                    </div>
                                                                    <a class="t-link" href="<?php echo get_term_link($item) ?>">
                                                                        <?php echo $child->name ?>
                                                                    </a>
                                                                </div>
                                                            </div>
                                                    <?php }
                                                    } ?>
                                                </div>
                                            </div>
                                        </div>
                                <?php }
                                } ?>
                            </div>
                        </div>
                    </div>
                    <div class="hd-cate-right">
                        <div class="hd-cate-img">
                            <div class="inner">
                                <?php echo  wp_get_attachment_image($mega_menu['images'], 'full') ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
<?php
        return ob_get_clean();
    }
}
