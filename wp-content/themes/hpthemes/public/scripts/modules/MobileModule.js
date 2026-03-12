export default function MobileModule() {
    const burgerBtn = document.getElementById("hamburger");
    const sideOpen  = document.querySelector('.side-open')
    const mobile = document.querySelector(".mobile");
    // const mobileOverLay = document.querySelector(".mobile-overlay");
    const body = document.getElementsByTagName("body")[0];
    const header = document.querySelector(".header");
    const mobileClose = document.querySelector(".mobile-close");
    let isOpen = false;

    function HandleOpen() {
        isOpen = !isOpen;
        if (isOpen) {
            burgerBtn.classList.add("active");
            mobile.classList.add("open");
            // mobileOverLay.classList.add("open");
            body.classList.add("no-scroll");

            if(sideOpen) {

                sideOpen.classList.add("event-none");
            }



        } else {
            burgerBtn.classList.remove("active");
            mobile.classList.remove("open");
            // mobileOverLay.classList.remove("open");
            body.classList.remove("no-scroll");
            if(sideOpen) {
                
                sideOpen.classList.remove("event-none");
            }

        }
    }

    function HandleClose() {
        isOpen = false;
        burgerBtn.classList.remove("active");
        mobile.classList.remove("open");
        // mobileOverLay.classList.remove("open");
        // header.classList.remove("sticky");
        body.classList.remove("no-scroll");
        if(sideOpen) {
                
            sideOpen.classList.remove("event-none");
        }

    }

    if (burgerBtn) {
        burgerBtn.addEventListener("click", () => {
            HandleOpen()
        });
    }
    if (mobileClose) {
        mobileClose.addEventListener("click", function() {
            HandleClose()
        });
    }
    // if (mobileOverLay) {
    //     mobileOverLay.addEventListener("click", function() {
    //         HandleClose()
    //     });
    // }

    const menuNavs = document.querySelectorAll(".header .menu-nav");
    // if (menuNavs) {
    //     menuNavs.forEach((item) => {
    //         const menuLinks = item.querySelectorAll(".menu-item.dropdown .menu-link");
    //         menuLinks.forEach((item) => {
    //             const contentOld = item.innerHTML;
    //             const contentNew = `${contentOld} <i class="fa-light fa-chevron-down"></i>`;
    //             item.innerHTML = contentNew;
    //         });
    //     });
    // }
    const arrowIcon = document.querySelectorAll(
        ".mobile-nav .menu-list .menu-item a i"
    );
    if (arrowIcon) {
        arrowIcon.forEach((item) => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const menu = item.parentElement.parentElement.querySelectorAll(".menu-list")[0];
                $(menu).slideToggle();
                $(item.parentElement.parentElement).toggleClass("active");
            });
        });
    }
}
MobileModule();
