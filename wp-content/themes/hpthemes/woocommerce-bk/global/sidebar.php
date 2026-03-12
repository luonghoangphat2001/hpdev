<?php

/**
 * Sidebar
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/global/sidebar.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see         https://woo.com/document/template-structure/
 * @package     WooCommerce\Templates
 * @version     1.6.4
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly
}

get_sidebar('shop');



$hp_product_fillter = get_field('hp_product_fillter', HP_WC_PRODUCTS);
?>

<?php if (!empty($hp_product_fillter)) { ?>
	<form action="<?php echo is_front_page() ? get_permalink(HP_WC_PRODUCTS) : ''; ?>">
		<div class="prd-cate-py">
			<div class="prd-cate-form">
				<div class="t-gr">
					<span class="icon"><img src="<?php echo HP_THEME_PATH ?>/public/images/icon-fill.svg" alt="" /></span>
					<span class="t-text">Bộ lọc tìm kiếm</span>
				</div>
				<?php

				$caterory = get_terms(
					array(
						'taxonomy' => 'category_address',
						'hide_empty' => true,
						'parent' => 0, // Lấy các danh mục cha
					)
				);
				if (!empty($caterory)) {
				?>
					<div class="prd-cate-fill">
						<div class="prd-cate-box">
							<p class="t-16 fw-6">
								<?php echo __('Vị trí ', 'monamedia')  ?>
							</p>
							<div class="prd-cate-ul recheck-block load-container" data-init="4" data-sl="99" data-show="Xem thêm" data-hide="Thu gọn">
								<?php foreach ($caterory as $key => $parent_category) { ?>
									<div class="prd-cate-li parent load-item">
										<div class="recheck-item">
											<input class="recheck-input" type="checkbox" <?php echo isset($_GET['taxonomie'][$parent_category->taxonomy])
																								&& (!empty($_GET['taxonomie'][$parent_category->taxonomy])
																									&& in_array($parent_category->slug, $_GET['taxonomie'][$parent_category->taxonomy])
																								) ? 'checked' : '' ?>
												name="taxonomie[<?php echo $parent_category->taxonomy ?>][]" value="<?php echo $parent_category->slug ?>" hidden="">
											<div class="recheck-checkbox"></div>
											<p class="recheck-text">
												<?php echo $parent_category->name ?>

											</p>

										</div>
										<a class="toggle-subcategories" data-parent-id="<?php echo $parent_category->term_id; ?>">
											<i class="fa-light fa-chevron-down"></i>
										</a>
										<div class="subcategories" id="subcategories-<?php echo $parent_category->term_id; ?>" style="display: none;">
											<?php
											$subcategories = get_terms(array(
												'taxonomy' => 'category_address',
												'hide_empty' => true,
												'parent' => $parent_category->term_id, // Lấy các danh mục con
											));

											foreach ($subcategories as $subcategory) { ?>
												<div class="prd-cate-li">
													<div class="recheck-item">
														<input class="recheck-input" type="checkbox" <?php echo isset($_GET['taxonomie'][$subcategory->taxonomy])
																											&& (!empty($_GET['taxonomie'][$subcategory->taxonomy])
																												&& in_array($subcategory->slug, $_GET['taxonomie'][$subcategory->taxonomy])
																											) ? 'checked' : '' ?>
															name="taxonomie[<?php echo $subcategory->taxonomy ?>][]" value="<?php echo $subcategory->slug ?>" hidden="">
														<div class="recheck-checkbox"></div>
														<p class="recheck-text">
															<?php echo $subcategory->name ?>
														</p>
													</div>
												</div>
											<?php } ?>
										</div>
									</div>
								<?php } ?>
								<div class="prd-cate-ctr">
									<div class="btn-link load-btn"><span class="text">Xem thêm</span></div>
								</div>
							</div>
						</div>
					</div>
				<?php } ?>
				<div class="prd-cate-fill">
					<div class="prd-cate-box">
						<p class="t-16 fw-6"> Mức giá</p>
						<div class="pcate-fillc-range">
							<div class="rang-block mb-10">
								<div class="range-min">
									<p class="t14">Giá thấp:</p>
									<input type="number" class="recheck-input" placeholder="0đ" name="price_min" value="<?php echo !empty($_GET['price_min']) ? $_GET['price_min'] : '' ?>">
								</div>
								<div class="range-min">
									<p class="t14">Giá cao:</p>
									<input type="number" class="range-max recheck-input" placeholder="0đ" name="price_max" value="<?php echo !empty($_GET['price_max']) ? $_GET['price_max'] : '' ?>">
								</div>
							</div>
						</div>
						<div class="prd-cate-ul recheck-block rang">


							<div class="prd-cate-li load-item">
								<div class="recheck-item">
									<input class="recheck-input" type="radio" <?php echo isset($_GET['price']) && $_GET['price'] == 50000000  ? 'checked' : '' ?> name="price" value="50000000">
									<div class="recheck-checkbox"></div>
									<p class="recheck-text">
										Dưới 50.000.000 VNĐ
									</p>
								</div>
							</div>
							<div class="prd-cate-li load-item">
								<div class="recheck-item">
									<input class="recheck-input" type="radio" <?php echo isset($_GET['price']) && $_GET['price'] == 100000000  ? 'checked' : '' ?> name="price" value="100000000">
									<div class="recheck-checkbox"></div>
									<p class="recheck-text">
										50.000.000 - 100.000.000 VNĐ
									</p>
								</div>
							</div>
							<div class="prd-cate-li load-item">
								<div class="recheck-item">
									<input class="recheck-input" type="radio" <?php echo isset($_GET['price']) && $_GET['price'] == 200000000  ? 'checked' : '' ?> name="price" value="200000000">
									<div class="recheck-checkbox"></div>
									<p class="recheck-text">
										100.000.000 - 200.000.000 VNĐ
									</p>
								</div>
							</div>
							<div class="prd-cate-li load-item">
								<div class="recheck-item">
									<input class="recheck-input" type="radio" <?php echo isset($_GET['price']) && $_GET['price'] == 300000000  ? 'checked' : '' ?> name="price" value="300000000">
									<div class="recheck-checkbox"></div>
									<p class="recheck-text">
										Trên 200.000.000 VNĐ
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				<?php
				foreach ($hp_product_fillter as $key => $value) {
					$caterory = get_terms(
						array(
							'taxonomy' => $value->name,
							'hide_empty' => true,
						)
					);
					if ($value->name == 'product_cat') {
						$term = get_queried_object(); // Lấy danh mục hiện tại
						$term_children = get_term_children($term->term_id, 'product_cat');
						if (is_tax() && $term_children) {

							$caterory = get_terms(
								array(
									'taxonomy' => 'product_cat',
									'hide_empty' => true,
									'parent' => $term->term_id, // Lấy các danh mục con của danh mục hiện tại
								)
							);
						}
				?>
						<div class="prd-cate-fill">
							<div class="prd-cate-box">
								<p class="t-16 fw-6">
									<?php echo str_replace('Sản phẩm', '', $value->label);  ?>
								</p>
								<div class="prd-cate-ul recheck-block load-container" data-init="4" data-sl="99" data-show="Xem thêm" data-hide="Thu gọn">
									<?php foreach ($caterory as $key => $value) { ?>
										<div class="prd-cate-li load-item">
											<div class="recheck-item">
												<input class="recheck-input" type="checkbox" <?php echo isset($_GET['taxonomie'][$value->taxonomy])
																									&& (!empty($_GET['taxonomie'][$value->taxonomy])
																										and in_array($value->slug, $_GET['taxonomie'][$value->taxonomy])
																									) ? 'checked' : '' ?> name="taxonomie[<?php echo $value->taxonomy ?>][]" value="<?php echo $value->slug ?>" id="" hidden="">
												<div class="recheck-checkbox"></div>
												<p class="recheck-text">
													<?php echo $value->name ?>
												</p>
											</div>
										</div>
									<?php
									} ?>
									<div class="prd-cate-ctr">
										<div class="btn-link load-btn"><span class="text">Xem thêm</span></div>
									</div>
								</div>
							</div>
						</div>
					<?php } else { ?>
						<div class="prd-cate-fill">
							<div class="prd-cate-box">
								<p class="t-16 fw-6">
									<?php echo str_replace('Sản phẩm', '', $value->label);  ?>
								</p>
								<div class="prd-cate-ul recheck-block load-container" data-init="4" data-sl="99" data-show="Xem thêm" data-hide="Thu gọn">
									<?php foreach ($caterory as $key => $value) { ?>
										<div class="prd-cate-li load-item">
											<div class="recheck-item">
												<input class="recheck-input" type="checkbox" <?php echo isset($_GET['taxonomie'][$value->taxonomy])
																									&& (!empty($_GET['taxonomie'][$value->taxonomy])
																										and in_array($value->slug, $_GET['taxonomie'][$value->taxonomy])
																									) ? 'checked' : '' ?> name="taxonomie[<?php echo $value->taxonomy ?>][]" value="<?php echo $value->slug ?>" id="" hidden="">
												<div class="recheck-checkbox"></div>
												<p class="recheck-text">
													<?php echo $value->name ?>
												</p>
											</div>
										</div>
									<?php
									} ?>
									<div class="prd-cate-ctr">
										<div class="btn-link load-btn"><span class="text">Xem thêm</span></div>
									</div>
								</div>
							</div>
						</div>
				<?php
					}
				} ?>


			</div>
		</div>
	</form>
<?php } ?>