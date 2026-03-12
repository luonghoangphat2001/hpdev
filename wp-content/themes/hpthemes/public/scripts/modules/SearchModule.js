export default function SearchModule() {
  var t1 = new TimelineMax({ paused: true, duration: 0 });

  t1.to(
    ".hd-search-wrap",
    0.5,
    {
      height: "100%",
      ease: Quart.easeIn,

      visibility: "visible",
    },
    "<0.1"
  );
  t1.from(".hd-search-wrap .hd-search-ip", 1, {
    width: "0%",
    opacity: 0,
    ease: Quart.easeOut,
  });

  t1.from(
    ".hd-search-close",
    0.5,
    {
      opacity: 0,
      ease: Quart.easeOut,
    },
    "<0.1"
  );
  t1.reverse();
  $(document).on("click", ".hd-open-search", function () {
    t1.reversed(!t1.reversed());
  });
  $(document).on("click", ".hd-search-close", function () {
    t1.reversed(!t1.reversed());
  });
}
