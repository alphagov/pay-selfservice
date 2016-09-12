(function(){
  refund = function(){
    var selects = $('input[name=refund-type]'),
    partial     =  selects.filter('[value=partial]'),
    close       = $('#show-refund .close'),
    showButton  = $('.show-refund-button'),
    lightbox    = $('#show-refund'),
    submit       = lightbox.find('input[type=submit]'),
    refundForm  = $('.refund-form');

    var init = function(){
      selects.on('change',toggleAmount);
      showButton.on('click',addLightBox);
      close.on('click',removeLightBox);
      toggleAmount();
      refundForm.on('submit',disableSubmit);
    },

    toggleAmount = function(){
      $('.refund-amount').toggleClass('shown',partial.is(':checked'));
    },

    removeLightBox = function(e) {
      lightbox.removeClass('shown');
    },

    addLightBox = function(e){
      e.preventDefault();
      lightbox.addClass('shown');
    },

    disableSubmit = function(e){
      submit.attr('disabled', 'disabled');
    };

    init();
  };
  refund();

})();
