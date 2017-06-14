$(document).ready(function () {
  "use strict";

  $('.js-toggle-confirm-dialog').click((event) => {
    console.log('clicking .js-toggle-confirm-dialog');
    $('.js-confirm').toggle();
    $('.js-confirm-dialog').toggle();
    $('.js-confirm-dialog').removeClass("hidden");
    event.preventDefault();
  });

  $('.js-confirm-close-dialog').click((event) => {
    console.log('clicking .js-confirm-close-dialog');
    $('.js-confirm-dialog').toggle();
    $('.js-confirm').toggle();
    event.preventDefault();
  });
});
