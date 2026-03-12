<?php
/**
 * The template for displaying 404 pages.
 *
 * @package HP.Media / Website
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$nf = new Hp_Setting_Not_Found();
$nf->__front_styles();
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_site_icon(); ?>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
    <main class="main">
        <div class="wrapper">
            <?php $nf->__front_template(); ?>
        </div>
    </main>
    <?php wp_footer(); ?>
</body>
</html>
