$(document).ready(function ($) {

    var buttons = $('.hp-call-buttons');
    if ( buttons.hasClass('buttonsMobile') ) {
        $('.hp-call-buttons .support-content').hide();
    }

    $('.hp-call-buttons .btn-support').click(function(e) {
        e.stopPropagation();
        $('.hp-call-buttons .support-content').slideToggle();
    });

    $('.hp-call-buttons .support-content').click(function(e) {
        e.stopPropagation();
    });

});