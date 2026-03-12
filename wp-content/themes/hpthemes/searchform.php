<div class="popup popup-search" data-popup-id="popup-search">
    <div class="popup-overlay"></div>
    <div class="popup-main">
        <div class="popup-main-wrapper">
            <div class="popup-over">
                <div class="popup-wrapper">
                    <div class="popup-search-form">
                        <div class="popup-search-title">
                            <p class="t-title t-center mb-10">
                                Bạn cần tìm gì ?
                            </p>
                        </div>

                        <form method="get" id="searchform" class="searchform" action="<?php echo esc_url(home_url('/')); ?>">
                            <div class="hd-search-ip">
                                <input type="text" name="s" value="<?php echo get_search_query(); ?>" placeholder="Nhập để tìm kiếm">
                                <button class="btn four">
                                    <span class="inner">Tìm kiếm</span>
                                    <span class="icon">
                                        <i class="fas fa-search"></i>
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="popup-close">
            <i class="fas fa-times icon"></i>
        </div>
    </div>
</div>