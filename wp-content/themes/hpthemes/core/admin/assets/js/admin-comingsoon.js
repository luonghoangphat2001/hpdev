jQuery(document).ready(function ($) {

    $(document).on('submit', '#mona-form-settings', function (e) {
        e.preventDefault();
        var $this = $(this);
        var loading = $this.find('button[type="submit"]');
        var formdata = new FormData($(this)[0]);
        formdata.append('action', 'mona_admin_ajax_update_comingsoon');
        if (!loading.hasClass('loading')) {
            $.ajax({
                url: mona_admin_ajax.ajaxURL,
                type: 'POST',
                contentType: false,
                processData: false,
                data: formdata,
                error: function (request) {
                    loading.removeClass('loading');
                },
                beforeSend: function (response) {
                    loading.addClass('loading');
                },
                success: function (response) {
                    // show notice
                    var toast = response.data.toast;
                    toastAction({
                        type: toast.type,
                        content: toast.content,
                        duration: toast.duration,
                    });
                    if (response.success) {
                        // result template
                        $('#mona-main-template').html(response.data.template);
                    }
                    // remove loading
                    loading.removeClass('loading');
                }
            });
        }
    });

    // Toast function
    function toastAction({ type = 'info', content = '', duration = 3000 }) {
        const main = document.getElementById('mona-toast');
        if (main) {
            const toast = document.createElement('div');

            // Auto remove toast
            const autoRemoveId = setTimeout(function () {
                main.removeChild(toast);
            }, duration + 1000);

            // Remove toast when clicked
            toast.onclick = function (e) {
                if (e.target.closest('.toast__close')) {
                    main.removeChild(toast);
                    clearTimeout(autoRemoveId);
                }
            };
            const delay = (duration / 1000).toFixed(2);

            toast.classList.add('toast-wrap', `toast--${type}`);
            toast.style.animation = `slideInLeft ease .3s, fadeOut linear 1s ${delay}s forwards`;

            toast.innerHTML = `${content}`;
            main.appendChild(toast);
        }
    }

});  