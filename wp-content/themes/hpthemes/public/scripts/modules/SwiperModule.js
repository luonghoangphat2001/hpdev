export default function SwiperModule() {
  function functionSlider(element, customizeOption, typePagi) {
    const swiperSlider = document.querySelectorAll(element);
    if (swiperSlider) {
      swiperSlider.forEach((item) => {
        const swiper = item.querySelector(".swiper");
        const pagi = item.querySelector(".swiper-pagination");
        const next = item.querySelector(".swiper-next");
        const prev = item.querySelector(".swiper-prev");
        if (!typePagi) {
          typePagi = "bullets";
        }
        var slide = new Swiper(swiper, {
          watchSlidesProgress: true,
          pagination: {
            el: pagi,
            type: typePagi,
            clickable: true,
          },
          navigation: {
            nextEl: next,
            prevEl: prev,
          },
          fadeEffect: {
            crossFade: true,
          },
          ...customizeOption,
        });
      });
    }
  }

  functionSlider(".pmenuSwiper", {
    slidesPerView: "auto",
    speed: 800,
    mousewheel: true,
    autoplay: {
      delay: 300000,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: ".pmenu-btn-next",
      prevEl: ".pmenu-btn-prev",
    },
  });

  var accomThumbSwiper = new Swiper(".accomThumbSwiper .swiper", {
    effect: "cube",
    grabCursor: true,
    speed: 1200,
    cubeEffect: {
      shadow: true,
      slideShadows: true,
      shadowOffset: 20,
      shadowScale: 0.94,
    },
    navigation: {
      nextEl: ".ab-thumb-btn-next",
      prevEl: ".ab-thumb-btn-prev",
    },
  });

  var accomSwiper = new Swiper(".accomSwiper .swiper", {
    slidesPerView: "auto",
    speed: 1200,
    effect: "slide",
    grabCursor: true,
    parallax: true,
    centeredSlides: true,
    thumbs: {
      swiper: accomThumbSwiper,
    },
    coverflowEffect: {
      rotate: 0,
      depth: 0,
      stretch: 0,
      modifier: 0,
      slideShadows: 0,
    },
    on: {
      init: function (e) {
        let swiper = this;
        for (let i = 0; i < swiper.slides.length; i++) {
          $(swiper.slides[i])
            .find(".bnh-parallax .inner")
            .attr({
              "data-swiper-parallax": 0.9 * swiper.width,
              "data-swiper-paralalx-opacity": 0.1,
            });
        }
        let index = swiper.activeIndex;
      },
      resize: function () {
        this.update();
      },
    },
  });

  accomThumbSwiper.on("slideChangeTransitionStart", function () {
    accomSwiper.slideTo(accomThumbSwiper.activeIndex);
  });
  accomSwiper.on("transitionStart", function () {
    accomThumbSwiper.slideTo(accomSwiper.activeIndex);
  });
}

SwiperModule();
