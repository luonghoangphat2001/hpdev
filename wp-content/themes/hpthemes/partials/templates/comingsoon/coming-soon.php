<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title( '|', true, 'right' ); ?></title>
    <meta name="description" content="<?php echo esc_attr( get_bloginfo( 'description' ) ); ?>">
    <?php wp_site_icon(); ?>

    <!-- Tailwind CDN (Play) — replaces Bootstrap, lineicons, animate.css -->
    <script src="<?php echo esc_url( HP_THEME_PATH . '/public/library/tailwind/cdn-tailwind.js' ); ?>"></script>

    <style>
        /* ---- Floating shape keyframe ---- */
        @keyframes cs-float {
            0%, 100% { transform: translateY(0)    rotate(0deg); }
            50%       { transform: translateY(-18px) rotate(6deg); }
        }
        .cs-shape { position: absolute; pointer-events: none; animation: cs-float 6s ease-in-out infinite; }
        .cs-shape:nth-child(2) { animation-delay: -1s;   animation-duration: 7s;   }
        .cs-shape:nth-child(3) { animation-delay: -2s;   animation-duration: 8s;   }
        .cs-shape:nth-child(4) { animation-delay: -3s;   animation-duration: 6.5s; }
        .cs-shape:nth-child(5) { animation-delay: -4s;   animation-duration: 9s;   }
        .cs-shape:nth-child(6) { animation-delay: -0.5s; animation-duration: 7.5s; }

        /* ---- Entrance animations (replaces WOW.js) ---- */
        @keyframes cs-fade-down { from { opacity:0; transform:translateY(-24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cs-fade-up   { from { opacity:0; transform:translateY( 24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cs-fade-left { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }

        .cs-fade-down { animation: cs-fade-down 0.65s ease both; }
        .cs-fade-up   { animation: cs-fade-up   0.65s ease both; }
        .cs-fade-left { animation: cs-fade-left 0.65s ease both; }
        .cs-delay-1   { animation-delay: 0.15s; }
        .cs-delay-2   { animation-delay: 0.30s; }
        .cs-delay-3   { animation-delay: 0.45s; }

        /* ---- Countdown tiles ---- */
        .cs-countdown { display: flex; gap: 1.4rem; flex-wrap: wrap; }
        .cs-tile {
            min-width: 7.6rem;
            background: rgba(255,255,255,.1);
            border: 1px solid rgba(255,255,255,.2);
            border-radius: 1.2rem;
            padding: 1.2rem 1rem;
            text-align: center;
            backdrop-filter: blur(8px);
        }
        .cs-num { display: block; font-size: 3.4rem; font-weight: 700; line-height: 1; color: #fff; }
        .cs-lbl { display: block; font-size: 1.1rem; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.55); margin-top: .4rem; }
    </style>
</head>
<body style="overflow:hidden;">

<?php
$cs      = new Hp_Setting_Coming_Soon();
$title   = $cs->__field_value( 'title',       __( 'Sắp ra mắt', 'hp-admin' ) );
$desc    = $cs->__field_value( 'description', '' );
$dealine = $cs->__field_value( 'dealine',     '' );

// Normalise deadline → Y/m/d (required by countdown.js)
if ( ! empty( $dealine ) ) {
    $dt      = new DateTime( $dealine );
    $dealine = $dt->format( 'Y/m/d' );
} else {
    $dealine = date( 'Y/m/d', strtotime( '+5 days' ) );
}

$theme = HP_THEME_PATH;
?>

<main class="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">

    <!-- Decorative floating shapes -->
    <img src="<?php echo esc_url( $theme . '/public/images/comingsoon/shape-1.svg' ); ?>" alt="" class="cs-shape w-[8rem] top-[8%]  left-[4%]  opacity-30">
    <img src="<?php echo esc_url( $theme . '/public/images/comingsoon/shape-2.svg' ); ?>" alt="" class="cs-shape w-[6rem] top-[15%] right-[8%] opacity-20">
    <img src="<?php echo esc_url( $theme . '/public/images/comingsoon/shape-3.svg' ); ?>" alt="" class="cs-shape w-[5rem] bottom-[20%] left-[10%] opacity-25">
    <img src="<?php echo esc_url( $theme . '/public/images/comingsoon/shape-4.svg' ); ?>" alt="" class="cs-shape w-[7rem] bottom-[10%] right-[5%] opacity-20">
    <img src="<?php echo esc_url( $theme . '/public/images/comingsoon/shape-5.svg' ); ?>" alt="" class="cs-shape w-[4rem] top-[50%] left-[2%] [opacity:.15]">
    <img src="<?php echo esc_url( $theme . '/public/images/comingsoon/shape-6.svg' ); ?>" alt="" class="cs-shape w-[9rem] top-[30%] right-[2%] [opacity:.15]">

    <div class="container relative z-10 px-[2rem]">
        <div class="grid grid-cols-2 gap-[6rem] items-center max-[768px]:grid-cols-1 max-[768px]:gap-[4rem] max-[768px]:text-center">

            <!-- Illustration -->
            <div class="cs-fade-left">
                <img src="<?php echo esc_url( $theme . '/public/images/comingsoon/img-1.svg' ); ?>"
                     alt="<?php echo esc_attr( $title ); ?>"
                     class="w-full max-w-[44rem] mx-auto drop-shadow-2xl">
            </div>

            <!-- Content -->
            <div class="flex flex-col gap-[2.4rem] max-[768px]:items-center">

                <h1 class="text-[4.2rem] font-bold text-white leading-[1.25] cs-fade-down max-[768px]:text-[3rem]">
                    <?php echo esc_html( $title ); ?>
                </h1>

                <?php if ( $desc ) : ?>
                    <p class="text-[1.6rem] text-white/70 leading-[1.75] max-w-[48rem] cs-fade-up cs-delay-1">
                        <?php echo esc_html( $desc ); ?>
                    </p>
                <?php endif; ?>

                <!-- Countdown -->
                <div class="cs-countdown cs-fade-up cs-delay-2"
                     data-countdown="<?php echo esc_attr( $dealine ); ?>"></div>

                <a href="<?php echo esc_url( get_site_url() ); ?>"
                   class="self-start inline-flex items-center gap-[0.8rem] text-[1.4rem] font-semibold text-[#ef519e] border border-[#ef519e] rounded-[0.8rem] px-[2rem] py-[0.9rem] transition-all duration-200 hover:bg-[#ef519e] hover:text-white cs-fade-up cs-delay-3 max-[768px]:self-center">
                    ← <?php _e( 'Trang chủ', 'hp-admin' ); ?>
                </a>

            </div>
        </div>
    </div>
</main>

<!-- jQuery (required by countdown.js) -->
<script src="<?php echo esc_url( $theme . '/public/scripts/comingsoon/vendor/jquery-3.5.1.min.js' ); ?>"></script>
<!-- Countdown plugin -->
<script src="<?php echo esc_url( $theme . '/public/scripts/comingsoon/countdown.js' ); ?>"></script>
<script>
jQuery(function ($) {
    $('[data-countdown]').each(function () {
        var $el   = $(this);
        var until = $el.data('countdown');
        $el.countdown(until, function (event) {
            $el.html(
                '<div class="cs-tile"><span class="cs-num">' + event.strftime('%D') + '</span><span class="cs-lbl">Ngày</span></div>' +
                '<div class="cs-tile"><span class="cs-num">' + event.strftime('%H') + '</span><span class="cs-lbl">Giờ</span></div>' +
                '<div class="cs-tile"><span class="cs-num">' + event.strftime('%M') + '</span><span class="cs-lbl">Phút</span></div>' +
                '<div class="cs-tile"><span class="cs-num">' + event.strftime('%S') + '</span><span class="cs-lbl">Giây</span></div>'
            );
        });
    });
});
</script>

</body>
</html>
