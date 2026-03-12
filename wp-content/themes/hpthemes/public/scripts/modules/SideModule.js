export default function SideModule() {
  const sideOpen = document.querySelector(".side-open");
  const sideClose = document.querySelector(".side-close");
  const sideFixed = document.querySelector(".side-fixed");
  const sideOverlay = document.querySelector(".side-overlay");
  const body = document.getElementsByTagName("body")[0];

  function Open() {
    sideFixed.classList.add("open");
    sideOverlay.classList.add("open");
    sideOpen.classList.add("close");
    body.style.overflowY = "hidden";
  }

  function Close() {
    sideFixed.classList.remove("open");
    sideOverlay.classList.remove("open");
    sideOpen.classList.remove("close");
    body.style.overflowY = "auto";
  }
  if (sideOpen) {
    sideOpen.addEventListener("click", () => {
      Open();
    });
  }
  if (sideClose) {
    sideClose.addEventListener("click", () => {
      Close();
    });
  }
  if (sideOverlay) {
    sideOverlay.addEventListener("click", () => {
      Close();
    });
  }

  const sideOpenc = document.querySelector(".pcate-open");
  const sideClosec = document.querySelector(".side-close-cate");
  const sideFixedc = document.querySelector(".pcate-fixed");
  const sideOverlayc = document.querySelector(".overlay-pcate");
  const bodyc = document.getElementsByTagName("body")[0];
  function sideOpencate() {
    sideFixedc.classList.add("open");
    sideOverlayc.classList.add("open");
    bodyc.style.overflowY = "hidden";
  }

  function sideClosecate() {
    sideFixedc.classList.remove("open");
    sideOverlayc.classList.remove("open");
    bodyc.style.overflowY = "auto";
  }
  if (sideOpenc) {
    sideOpenc.addEventListener("click", () => {
      sideOpencate();
    });
  }
  if (sideClosec) {
    sideClosec.addEventListener("click", () => {
      sideClosecate();
    });
  }
  if (sideOverlayc) {
    sideOverlayc.addEventListener("click", () => {
      sideClosecate();
    });
  }
}

SideModule();
