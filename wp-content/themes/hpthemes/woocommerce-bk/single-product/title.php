<?php

/**
 * Single Product title
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/title.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see        https://woo.com/document/template-structure/
 * @package    WooCommerce\Templates
 * @version    1.6.4
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}

$terms_cat = get_the_terms(get_the_ID(), 'product_cat');
$category_address = get_the_terms(get_the_ID(), 'category_address');
// the_title('<h1 class="product_title entry-title">', '</h1>');
?>
<div class="prds-head">
	<div class="head">
		<h2 class="t-title"> <?php echo get_the_title() ?></h2>
	</div>
	<div class="t-igr">
		<?php if (!empty($terms_cat)) { ?>
			<div class="t-gr">
				<i class="fas fa-book"></i>
				<?php foreach ($terms_cat as $index => $term) { ?>
					<a class="t-text" href="<?php echo get_term_link($term) ?>">
						<?php echo $term->name; ?>
					</a>
					<?php if ($index < count($terms_cat) - 1) {
						echo ', ';
					} // Thêm dấu phẩy trừ phần tử cuối 
					?>
				<?php } ?>
			</div>
		<?php } ?>


	</div>
	<div class="t-igr">
		<?php if (!empty($category_address)) { ?>
			<div class="t-gr">
				<i class="fas fa-map-marker-alt"></i>
				<?php foreach ($category_address as $index => $term) { ?>

					<a class="t-text" href="<?php echo get_term_link($term) ?>">
						<?php echo $term->name; ?>
					</a>
					<?php if ($index < count($category_address) - 1) {
						echo ', ';
					} // Thêm dấu phẩy trừ phần tử cuối 
					?>
				<?php } ?>
			</div>
		<?php } ?>
	</div>
</div>