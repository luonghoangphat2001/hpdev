import { CountUp } from "../../library/countUp/countUp.min.js"
export default function CountUpModule() {
    let num = document.querySelectorAll(".countNum");
    num.forEach((v) => {
        let n = parseInt(v.textContent);
        var countUp = new CountUp(v, n, {
            separator: ",",
            decimal: '',
        });
        let check = true;
        window.addEventListener("scroll", () => {
            if (v.getBoundingClientRect().top < window.innerHeight && check) {
                countUp.start();
                check = false;
            }
        });
    });
}
CountUpModule();
