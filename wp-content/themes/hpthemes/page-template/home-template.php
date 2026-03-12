<?php

/**
 * Template name: Trang chủ
 * @author : HP.Media / Website
 */
get_header();
while (have_posts()) :
    the_post();
    $hp_banner = get_field('hp_banner')
?>
    <main class="main page-template">
        <div class="hban">
            <?php if ($hp_banner['select'] == 1) { ?>
                <div class="hban-wrap hban-wrap-img hidden">
                    <div class="hban-img">
                        <?php echo wp_get_attachment_image($hp_banner['images'], 'full') ?>
                    </div>
                    <div class="hban-desc">
                        <div class="hban-desc-inner">
                            <h1 class="title t-center">
                                <?php echo $hp_banner['title'] ?>
                            </h1>
                            <p class="txt t-center">
                                <?php echo $hp_banner['content'] ?>
                            </p>
                            <a class="btn btn-pri" href=" <?php echo $hp_banner['link'] ?>">
                                <span class="text">
                                    <?php echo $hp_banner['btn'] ?>
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            <?php } else { ?>
                <div class="hban-wrap hban-wrap-video ">
                    <div class="hban-video">
                        <video loop muted autoplay playsinline>
                            <!-- Video cho desktop -->
                            <source src="<?php echo $hp_banner['video']; ?>" type="video/mp4" media="(min-width: 768px)">
                            <!-- Video cho mobile -->
                            <source src="<?php echo $hp_banner['video_mobile']; ?>" type="video/mp4" media="(max-width: 767px)">
                            Trình duyệt của bạn không hỗ trợ video.
                        </video>

                    </div>
                </div>
            <?php } ?>
        </div>
    </main>
<?php
endwhile;
get_footer();
