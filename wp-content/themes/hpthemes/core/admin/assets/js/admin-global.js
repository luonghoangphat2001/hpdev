jQuery(document).ready(function($) {

    $('.hp-redirect-admin').on('click', function() {
        var redirect = $(this).data('redirect');
        window.location.href = redirect;
    });

    $('.hp-redirect-admin').hover(
        function() {
            var redirect = $(this).data('redirect');
            var tag_a = $(this).closest('a').attr('href', redirect);
                $(this).addClass('hovered');
            },
            function() {
                var tag_a = $(this).closest('a').attr('href', 'javascript:;');
                $(this).removeClass('hovered');
            }
        );
    });

    document.addEventListener('DOMContentLoaded', function () {
        const leftDivs = document.querySelectorAll('.widget-liquid-left');
        const rightDivs = document.querySelectorAll('.widget-liquid-right');
  
    for (let i = 0; i < leftDivs.length; i++) {
        const leftDiv = leftDivs[i];
        const rightDiv = rightDivs[i];

        const parentContainer = document.createElement('div');
        parentContainer.classList.add('widget-liquid-wrapper');

        parentContainer.appendChild(leftDiv.cloneNode(true));
        parentContainer.appendChild(rightDiv.cloneNode(true));

        leftDiv.parentNode.replaceChild(parentContainer, leftDiv);
        rightDiv.parentNode.removeChild(rightDiv);
    }

});