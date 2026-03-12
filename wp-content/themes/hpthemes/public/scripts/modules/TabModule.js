export default function TabModule() {

    let tab = document.querySelectorAll('.tabJS');
    if (tab) {
        tab.forEach((t) => {
            let tBtn = t.querySelectorAll('.tabBtn');
            let tPanel = t.querySelectorAll('.tabPanel');

            // for tab
            if (tBtn.length !== 0 && tPanel.length === tBtn.length) {
                tBtn[0].classList.add('active');
                // tPanel[0].classList.add('open');
                $(tPanel[0]).slideDown();

                for (let i = 0; i < tBtn.length; i++) {
                    tBtn[i].addEventListener('click', showPanel);

                    function showPanel(e) {
                        e.preventDefault();
                        for (let a = 0; a < tBtn.length; a++) {
                            tBtn[a].classList.remove('active');
                            // tPanel[a].classList.remove('open');
                            $(tPanel[a]).slideUp(400);

                        }
                        tBtn[i].classList.add('active');
                        // tPanel[i].classList.add('open');
                        $(tPanel[i]).slideDown(400);

                    }
                }
            }
        });
    }

    const techHeads = document.querySelectorAll(".tech-item-head");
    const techBlocks = document.querySelectorAll(".tech-block");

    // if (techBlocks) {
    //   techBlocks.forEach((item) => {
    //     item.querySelectorAll(".tech-item-head")[0].classList.add("active");
    //     const techBody = item.querySelectorAll(".tech-body")[0];
    //     $(techBody).slideDown();
    //   });
    // }
    if (techHeads) {
      techHeads.forEach((item) => {
        item.addEventListener("click", () => {
          const techBody = item.parentElement.querySelector(".tech-body");
          $(techBody).slideToggle();
          $(item).toggleClass("active");
          const techBlock = item.closest(".tech-block");
            if (techBlock) {
                $(techBlock).toggleClass("active");
            }
        });
      });
    }


}
TabModule();
