<?php

/**
 * Product quantity inputs
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/global/quantity-input.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.8.0
 *
 * @var bool   $readonly If the input should be set to readonly mode.
 * @var string $type     The input type attribute.
 */

defined('ABSPATH') || exit;

/* translators: %s: Quantity. */
$label = !empty($args['product_name']) ? sprintf(esc_html__('%s quantity', 'woocommerce'), wp_strip_all_tags($args['product_name'])) : esc_html__('Quantity', 'woocommerce');

?>
<div class="t-gr">
	<?php if (is_single('product')) {
		echo '<p class="t-text t16 fw-6">' . __('Số lượng', 'HPmedia') . '</p>';
	} ?>
	<div class="count">
		<div class="count-btn count-minus"> <i class="fas fa-minus icon"></i></div>
		<input type="<?php echo esc_attr($type); ?>" <?php echo $readonly ? 'readonly="readonly"' : ''; ?> id="<?php echo esc_attr($input_id); ?>" class="<?php echo esc_attr(join(' ', (array) $classes)); ?> count-input" name="<?php echo esc_attr($input_name); ?>" value="<?php echo esc_attr($input_value); ?>" aria-label="<?php esc_attr_e('Product quantity', 'woocommerce'); ?>" hidden="hidden" size="4" min="<?php echo esc_attr($min_value); ?>" max="<?php echo esc_attr(0 < $max_value ? $max_value : '99'); ?>" <?php if (!$readonly) : ?> step="<?php echo esc_attr($step); ?>" placeholder="<?php echo esc_attr($placeholder); ?>" inputmode="<?php echo esc_attr($inputmode); ?>" autocomplete="<?php echo esc_attr(isset($autocomplete) ? $autocomplete : 'on'); ?>" <?php endif; ?> />
		<p class="count-number"><?php echo esc_attr($input_value); ?> </p>
		<div class="count-btn count-plus"> <i class="fas fa-plus icon"></i></div>
	</div>
</div>
<?php
