<?php

/**
 * The template for displaying header.
 *
 * @package HP.Media / Website
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<!--[if IE 7]>
<html class="ie ie7" <?php language_attributes(); ?>>
<![endif]-->
<!--[if IE 8]>
<html class="ie ie8" <?php language_attributes(); ?>>
<![endif]-->
<!--[if !(IE 7) & !(IE 8)]><!-->
<html <?php language_attributes(); ?>>
<!--<![endif]-->

<head>
    <!-- Meta ================================================== -->
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, width=device-width">
    <?php wp_site_icon(); ?>
    <link rel="pingback" href="<?php bloginfo('pingback_url'); ?>" />
    <script src="<?php echo HP_THEME_PATH; ?>/public/library/jquery/jquery.js"></script>
    <?php wp_head(); ?>
</head>
<?php
if (wp_is_mobile()) {
    $body = 'mobile-detect';
} else {
    $body = 'desktop-detect';
}

?>

<body <?php body_class($body); ?>>
    <header class="header">
        <div class="header-wrapper">
            <div class="header-wrap">
                <div class="header-burger">
                    <div class="hamburger" id="hamburger">
                        <label class="hamburger-label" for="menu_checkbox">
                            <div class="hamburger-text"></div>
                        </label>
                    </div>
                </div>
                <div class="header-text">
                    <span class="letters txt swift-up-text">HPDEV</span>
                </div>
            </div>
            <div class="mobile">
                <div class="mobile-con">
                    <div class="mobile-wr">
                        <div class="mobile-nav">
                            <?php
                            if (has_nav_menu('primary-menu')) {
                                wp_nav_menu(array(
                                    'container' => false,
                                    'container_class' => 'menu-list',
                                    'menu_class' => 'menu-list',
                                    'theme_location' => 'primary-menu',
                                    'before' => '',
                                    'after' => '',
                                    'link_before' => '',
                                    'link_after' => '',
                                    'fallback_cb' => false,
                                    'walker' => new Hp_Walker_Nav_Menu,
                                ));
                            }
                            ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>