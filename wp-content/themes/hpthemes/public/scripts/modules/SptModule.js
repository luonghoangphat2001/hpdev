export default function SptModule() {
  // js for show pass word in profile form
  $(".show-password").click(function () {
    // console.log("show pass");
    const pwd = $(this).siblings("input");
    if (pwd.attr("type") == "password") {
      pwd.attr("type", "text");
      // console.log("show");
      // $(this).parent().addClass("show");
      $(this).removeClass("fa-eye-slash");
      $(this).addClass("fa-eye");
    } else {
      pwd.attr("type", "password");
      $(this).addClass("fa-eye-slash");
      $(this).removeClass("fa-eye");
    }
  });


  const swiftUpElements = document.querySelectorAll('.swift-up-text');

  swiftUpElements.forEach(elem => {
  
    const words = elem.textContent.split(' ');
    elem.innerHTML = '';
  
    words.forEach((el, index) => {
      words[index] = `<span><i>${words[index]}</i></span>`;
    });
  
    elem.innerHTML = words.join(' ');
  
    const children = document.querySelectorAll('span > i');
    children.forEach((node, index) => {
      node.style.animationDelay = `${index * .4}s`;
    });
  
  });




  


}

SptModule();
