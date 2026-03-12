<?php $hp_global = get_field('hp_global', HP_PAGE_HOME);
if (content_exists($hp_global)) { ?>
    <div class="hsup">
        <div class="hsup-wrap">
            <div class="container">
                <div class="hsup-flex">
                    <div class="hsup-col">
                        <?php if (!function_exists('dynamic_sidebar') || !dynamic_sidebar('footer_columtop1')) : ?><?php endif; ?>
                    </div>
                    <div class="hsup-col">
                        <?php if (!function_exists('dynamic_sidebar') || !dynamic_sidebar('footer_columtop2')) : ?><?php endif; ?>
                    </div>
                    <div class="hsup-col">
                        <div class="hsup-mail">

                            <h3 class="head footer-title">
                                <?php echo $hp_global['title'] ?>
                            </h3>
                        </div>
                        <div class="header-srch">
                            <?php echo do_shortcode($hp_global['form']) ?>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
<?php } ?>