<div class="flex flex-col items-center justify-center min-h-screen text-center px-[2rem]">

    <!-- 404 number block -->
    <div class="relative flex items-center justify-center h-[24rem] mb-[1.6rem] max-[768px]:h-[18rem] max-[480px]:h-[14rem]">
        <p class="absolute top-0 left-1/2 -translate-x-1/2 text-[1.5rem] font-bold uppercase tracking-[0.3em] text-[#262626] whitespace-nowrap">
            <?php _e( 'Oops! Page not found', 'HPmedia' ); ?>
        </p>
        <h1 class="text-[25rem] font-black text-[#262626] leading-none tracking-[-0.15em] select-none
                   max-[991px]:text-[20rem] max-[767px]:text-[16rem] max-[480px]:text-[13rem]"
            aria-hidden="true">
            <span class="[text-shadow:-0.8rem_0_0_#fff]">4</span><span class="[text-shadow:-0.8rem_0_0_#fff]">0</span><span class="[text-shadow:-0.8rem_0_0_#fff]">4</span>
        </h1>
    </div>

    <h2 class="text-[2rem] font-normal uppercase text-black mb-[2.4rem] max-[767px]:text-[1.6rem]">
        <?php _e( 'We are sorry, but the page you requested was not found', 'HPmedia' ); ?>
    </h2>

    <a href="<?php echo esc_url( get_site_url() ); ?>"
       class="inline-block font-bold uppercase text-[#1d1d1d] border border-[rgba(112,112,112,0.2)] px-[2rem] py-[1rem] rounded-full
              transition-[background-color] duration-300 [transition-timing-function:cubic-bezier(0.61,0.22,0.23,1)]
              hover:bg-[rgba(29,29,29,0.15)]">
        <?php _e( 'Back to the home page', 'HPmedia' ); ?>
    </a>

</div>
