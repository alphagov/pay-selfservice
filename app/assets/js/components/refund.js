(function(){
  refund = function(){
    var selects = $('input[name=refund-type]'),
    partial     =  selects.filter('[value=partial]'),
    lightbox    = $('#show-refund');

    var init = function(){
      selects.on('change',toggleAmount);
      lightbox.on('click',removeLightBox);
    },

    toggleAmount = function(){
      $('.refund-amount').toggleClass('shown',partial.is(':checked'));
    },
    removeLightBox = function(e) {
      let notChildElement = $(e.target).is(lightbox);
      console.log("HI",notChildElement);
      if (notChildElement) window.location.hash= "";
    };

    init();
  };
  refund();

})();
