(function(){
  refund = function(){
    var selects = $('input[name=refund-type]'),
    partial     =  selects.filter('[value=partial]'),
    close       = $('#show-refund .close'),
    showButton  = $('.show-refund-button'),
    lightbox    = $('#show-refund'),
    submit       = lightbox.find('input[type=submit]');

    var init = function(){
      selects.on('change',toggleAmount);
      showButton.on('click',addLightBox);
      close.on('click',removeLightBox);
      toggleAmount();
      submit.on('click',disableSubmit);
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
      setTimeout(()=> {$(this).attr('disabled', 'disabled');},50);
    };

    init();
  };
  refund();

})();
