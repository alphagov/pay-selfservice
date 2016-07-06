(function(){
  refund = function(){
    var selects = $('input[name=refund-type]'),
    partial     =  selects.filter('[value=partial]'),
    lightbox    = $('#show-refund'),
    showButton  = $('.show-refund-button');

    var init = function(){
      selects.on('change',toggleAmount);
      showButton.on('click',addLightBox)
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
    };

    init();
  };
  refund();

})();
