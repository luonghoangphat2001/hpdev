jQuery(document).ready(function ($) {
  //change this value if you want to change the speed of the scale effect
  var scaleSpeed = 0.3,
    //change this value if you want to set a different initial opacity for the .cd-half-block
    boxShadowOpacityInitialValue = 0.7,
    animating = false;

  //check the media query
  var MQ = window
    .getComputedStyle(document.querySelector("body"), "::before")
    .getPropertyValue("content")
    .replace(/"/g, "")
    .replace(/'/g, "");
  $(window).on("resize", function () {
    MQ = window
      .getComputedStyle(document.querySelector("body"), "::before")
      .getPropertyValue("content")
      .replace(/"/g, "")
      .replace(/'/g, "");
  });

  //bind the animation to the window scroll event
  triggerAnimation();
  $(window).on("scroll", function () {
    triggerAnimation();
    autoCorrectBlocks();
  });

  //move to next/previous section
  $(".cd-vertical-nav .cd-prev").on("click", function () {
    prevSection();
  });
  $(".cd-vertical-nav .cd-next").on("click", function () {
    nextSection();
  });
  $(document).keydown(function (event) {
    if (event.which == "38") {
      prevSection();
      event.preventDefault();
    } else if (event.which == "40") {
      nextSection();
      event.preventDefault();
    }
  });

  function triggerAnimation() {
    if (MQ == "desktop") {
      //if on desktop screen - animate sections
      !window.requestAnimationFrame
        ? animateSection()
        : window.requestAnimationFrame(animateSection);
    } else {
      //on mobile - remove the style added by jQuery
      $(".cd-section")
        .find(".cd-block")
        .removeAttr("style")
        .find(".cd-half-block")
        .removeAttr("style");
    }
    //update navigation arrows visibility
    checkNavigation();
  }

  function animateSection() {
    var scrollTop = $(window).scrollTop(),
      windowHeight = $(window).height(),
      windowWidth = $(window).width();
    var blockNumber = 0;

    $(".cd-section").each(function () {
      var actualBlock = $(this),
        offset = scrollTop - actualBlock.offset().top,
        scale = 1,
        translate = windowWidth / 2 + "px",
        opacity,
        boxShadowOpacity;

      blockNumber++;

      if (offset >= -windowHeight && offset <= 0) {
        //move the two .cd-half-block toward the center - no scale/opacity effect
        (scale = 1),
          (opacity = 1),
          (translate =
            (windowWidth * 0.5 * (-offset / windowHeight)).toFixed(0) + "px");
      } else if (offset > 0 && offset <= windowHeight) {
        //the two .cd-half-block are in the center - scale the .cd-block element and reduce the opacity
        (translate = 0 + "px"),
          (scale = (1 - (offset * scaleSpeed) / windowHeight).toFixed(5)),
          (opacity = (1 - offset / windowHeight).toFixed(5));
      } else if (offset < -windowHeight) {
        //section not yet visible
        (scale = 1), (translate = windowWidth / 2 + "px"), (opacity = 1);
      } else {
        //section not visible anymore
        opacity = 0;
      }

      boxShadowOpacity =
        (parseInt(translate.replace("px", "")) * boxShadowOpacityInitialValue) /
        20;

      //translate/scale section blocks
      scaleBlock(actualBlock.find(".cd-block"), scale, opacity);

      var directionFirstChild = actualBlock.is(":nth-of-type(even)")
        ? "-"
        : "+";
      var directionSecondChild = actualBlock.is(":nth-of-type(even)")
        ? "+"
        : "-";
      // var directionFirstChild = '-';
      // var directionSecondChild = '+';

      // if( blockNumber == 1 && parseInt(directionFirstChild+translate) > 0 && parseInt(directionSecondChild+translate) < 0 ) {
      // 	translateBlock(actualBlock.find('.cd-half-block').eq(0), '0', boxShadowOpacity);
      // 	translateBlock(actualBlock.find('.cd-half-block').eq(1), '0', boxShadowOpacity);
      // } else if(actualBlock.find('.cd-half-block')) {
      // 	translateBlock(actualBlock.find('.cd-half-block').eq(0), directionFirstChild+translate, boxShadowOpacity);
      // 	translateBlock(actualBlock.find('.cd-half-block').eq(1), directionSecondChild+translate, boxShadowOpacity);
      // }

      //this is used to navigate through the sections
      if (offset >= 0 && offset < windowHeight) {
        $(".cd-section.is-visible").removeClass("is-visible");
        actualBlock.addClass("is-visible");
      }

      if (actualBlock.find(".cd-half-block")) {
        translateBlock(
          actualBlock.find(".cd-half-block").eq(0),
          directionFirstChild + translate,
          boxShadowOpacity
        );
        translateBlock(
          actualBlock.find(".cd-half-block").eq(1),
          directionSecondChild + translate,
          boxShadowOpacity
        );
      }
      // this is used to navigate through the sections
      offset >= 0 && offset < windowHeight
        ? actualBlock.addClass("is-visible")
        : actualBlock.removeClass("is-visible");
    });
  }

  var autoScrollTimer;

  function autoCorrectBlocks() {
    if (MQ != "desktop") {
      return;
    }

    var windowWidth = Math.ceil($(window).width());
    var $currentBlock = $(".cd-section.is-visible")
      .find(".cd-half-block")
      .eq(0);
    var $nextBlock = $(".cd-section.is-visible")
      .next()
      .find(".cd-half-block")
      .eq(0);

    if ($nextBlock.length > 0) {
      clearTimeout(autoScrollTimer);

      autoScrollTimer = setTimeout(function () {
        var matrix = $nextBlock.eq(0).css("transform");

        if (matrix) {
          var values = matrix.match(/-?[\d\.]+/g);
          var x = values[4];

          if (Math.abs(x) > 0 && Math.abs(x) < windowWidth / 4) {
            clearTimeout(autoScrollTimer);

            autoScrollTimer = setTimeout(function () {
              if (!disableCurtainAutocorrect) {
                nextSection();
              }
            }, 150);
          }

          if (Math.abs(x) < windowWidth / 2 && Math.abs(x) > windowWidth / 4) {
            clearTimeout(autoScrollTimer);

            autoScrollTimer = setTimeout(function () {
              if (!disableCurtainAutocorrect) {
                prevSection();
              }
            }, 150);
          }
        }
      }, 200);
    }
  }

  function translateBlock(elem, value, shadow) {
    var position = Math.ceil(Math.abs(value.replace("px", "")));

    if (position >= $(window).width() / 2) {
      shadow = 0;
    } else if (position > 20) {
      shadow = boxShadowOpacityInitialValue;
    }

    elem.css({
      "-moz-transform": "translateX(" + value + ")",
      "-webkit-transform": "translateX(" + value + ")",
      "-ms-transform": "translateX(" + value + ")",
      "-o-transform": "translateX(" + value + ")",
      transform: "translateX(" + value + ")",
      "box-shadow": "0px 0px 40px rgba(0,0,0," + shadow + ")",
    });
  }

  function scaleBlock(elem, value, opac) {
    elem.css({
      "-moz-transform": "scale(" + value + ")",
      "-webkit-transform": "scale(" + value + ")",
      "-ms-transform": "scale(" + value + ")",
      "-o-transform": "scale(" + value + ")",
      transform: "scale(" + value + ")",
      opacity: opac,
    });
  }

  function nextSection() {
    if (!animating) {
      if ($(".cd-section.is-visible").next().length > 0)
        smoothScroll($(".cd-section.is-visible").next());
    }
  }

  function prevSection() {
    if (!animating) {
      var prevSection = $(".cd-section.is-visible");
      if (
        prevSection.length > 0 &&
        $(window).scrollTop() != prevSection.offset().top
      ) {
        smoothScroll(prevSection);
      } else if (
        prevSection.prev().length > 0 &&
        $(window).scrollTop() == prevSection.offset().top
      ) {
        smoothScroll(prevSection.prev(".cd-section"));
      }
    }
  }

  function checkNavigation() {
    $(window).scrollTop() < $(window).height() / 2
      ? $(".cd-vertical-nav .cd-prev").addClass("inactive")
      : $(".cd-vertical-nav .cd-prev").removeClass("inactive");
    $(window).scrollTop() > $(document).height() - (3 * $(window).height()) / 2
      ? $(".cd-vertical-nav .cd-next").addClass("inactive")
      : $(".cd-vertical-nav .cd-next").removeClass("inactive");
  }

  function smoothScroll(target) {
    animating = true;
    $("body,html").animate(
      { scrollTop: Math.ceil(target.offset().top) },
      500,
      function () {
        animating = false;
      }
    );
  }

  function swapCurtainBlocks(target) {
    var windowWidth = window.innerWidth;

    if (windowWidth <= 1199) {
      $(".curtain-section-image").each(function () {
        var $this = $(this);
        var $prevEl = $this.prev();
        if ($prevEl.hasClass("curtain-section-text")) {
          $this.addClass("is-swapped");
          $this.insertBefore($prevEl);
        }
      });
    } else {
      $(".is-swapped").each(function () {
        var $this = $(this);
        var $nextEl = $this.next();
        if ($nextEl.hasClass("curtain-section-text")) {
          $this.removeClass("is-swapped");
          $nextEl.insertBefore($this);
        }
      });
      setTimeout(function () {
        autoCorrectBlocks();
      }, 0);
    }
  }

  swapCurtainBlocks();

  $(window).on("resize", function () {
    swapCurtainBlocks();
  });

  // Used for the Curtain auto correct to not fire if the user has the mouse down
  var clickedOnScrollbar = function (mouseX) {
    if ($(window).outerWidth() <= mouseX) {
      return true;
    }
  };

  var disableCurtainAutocorrect = false;
  $(document)
    .mousedown(function (e) {
      if (e.which == 1) {
        if (clickedOnScrollbar(e.clientX)) {
          disableCurtainAutocorrect = true;
        }
      }
    })
    .mouseup(function (e) {
      if (e.which == 1) {
        disableCurtainAutocorrect = false;
        autoCorrectBlocks();
      }
    });

  $(document).bind("mousewheel", function () {
    if (animating) {
      return false;
    }
  });
});
