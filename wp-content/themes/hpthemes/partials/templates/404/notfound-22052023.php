<style>
/* ---- 22052023 template — animated colour-blend 404 ---- */
/* Compound: nth-child, ::before pseudo-element, mix-blend-mode */
/* Cannot use Tailwind for these */
.notfound-22052023 .number {
    position: relative;
    font: 900 30vmin Consolas, monospace;
    letter-spacing: 5vmin;
    text-shadow:
        2px  -1px 0 #000,  4px  -2px 0 #0a0a0a,
        6px  -3px 0 #0f0f0f, 8px  -4px 0 #141414,
        10px -5px 0 #1a1a1a, 12px -6px 0 #1f1f1f,
        14px -7px 0 #242424, 16px -8px 0 #292929;
}
.notfound-22052023 .number::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: #673ab7;
    background-image:
        radial-gradient(closest-side at 50% 50%, #ffc107 100%, transparent),
        radial-gradient(closest-side at 50% 50%, #e91e63 100%, transparent);
    background-repeat: repeat-x;
    background-size: 40vmin 40vmin;
    background-position: -100vmin 20vmin, 100vmin -25vmin;
    mix-blend-mode: screen;
    animation: nf22-move 10s linear infinite both;
}
@keyframes nf22-move {
    to { background-position: 100vmin 20vmin, -100vmin -25vmin; }
}
.notfound-22052023 .label {
    font: 400 5vmin Courgette, cursive;
}
.notfound-22052023 .label span {
    font-size: 10vmin;
}
</style>

<div class="flex flex-col items-center justify-center min-h-screen text-center select-none overflow-hidden bg-white notfound-22052023">
    <div class="number"><?php _e( '404', 'HPmedia' ); ?></div>
    <p class="label mt-[2rem]">
        <span><?php _e( 'Ooops...', 'HPmedia' ); ?></span><br>
        <?php _e( 'Page not found', 'HPmedia' ); ?>
    </p>
    <a href="<?php echo esc_url( home_url() ); ?>"
       class="mt-[3rem] inline-block text-[1.6rem] font-semibold text-[#673ab7] border-b-2 border-[#673ab7] pb-[0.2rem] transition-opacity duration-200 hover:opacity-70">
        ← <?php _e( 'Trang chủ', 'HPmedia' ); ?>
    </a>
</div>
