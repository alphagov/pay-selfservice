$(document).ready(function () {
  "use strict";

  $('.js-toggle-confirm-dialog').click((event) => {
    $('.js-confirm').toggle();
    $('.js-confirm-dialog').toggle();
    $('.js-confirm-dialog').removeClass("hidden");
    event.preventDefault();
  });

  $('.js-confirm-close-dialog').click((event) => {
    $('.js-confirm-dialog').toggle();
    $('.js-confirm').toggle();
    event.preventDefault();
  });
});
