export default function scrollContent() {
  const speed = 300;
  // NẾU CÓ ĐỊA CHỈ ID TRÊN THANH URL THÌ SCROLL XUỐNG
  const hash = window.location.hash;
  if ($(hash).length) scrollToID(hash, speed);
  // TÌM ĐỊA CHỈ ID VÀ SCROLL XUỐNG NẾU CÓ CLASS
  $("a[href*='#']").on("click", function (e) {
    e.preventDefault();

    const href = $(this).find("> a").attr("href") || $(this).attr("href");
    const id = href.slice(href.lastIndexOf("#"));
    if ($(id).length) {
      scrollToID(id, speed);
    } else {
      // window.location.replace(`/${id}`);
      window.location.href = href;
    }
  });

  // HÀM SCROLL CHO MƯỢT MÀ
  function scrollToID(id, speed) {
    let offSet = $(".header").outerHeight();
    // Check if the screen width is less than 1200px
    if ($(window).width() < 1200) {
      offSet += 60;
    } else if ($(window).width() < 768) {
      offSet += 40;
    }
    const section = $(id).offset();
    const targetOffset = section.top - offSet;
    $("html,body").animate({ scrollTop: targetOffset }, speed);
  }



}
