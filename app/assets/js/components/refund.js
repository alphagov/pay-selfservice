(function(){
  refund = function(){
    var selects         = $('input[name=refund-type]'),
    partial             =  selects.filter('[value=partial]'),
    showButton          = $('.refund__toggle'),
    showButtonContainer = $('.refund__toggle-container'),
    refundForm          = $('.refund__form'),
    refundAmount        = $('.refund__amount'),
    submit              = refundForm.find('input[type=submit]'),
    cancelRefund        = $('.refund__cancel-button');

    var init = function(){
      selects.on('change',toggleAmount);
      showButton.on('click',showRefundForm);
      cancelRefund.on('click',hideRefundForm);
      toggleAmount();
      refundForm.on('submit',disableSubmit);
    },

    toggleAmount = function(){
      refundAmount.toggleClass('active',partial.is(':checked'));
    },

    showRefundForm = function(e){
      e.preventDefault();
      refundForm.addClass('active');
      showButtonContainer.toggleClass('active');
    },

    hideRefundForm = function(e) {
      e.preventDefault();
      refundForm.removeClass('active');
      showButtonContainer.toggleClass('active');
    },

    disableSubmit = function(e){
      submit.attr('disabled', 'disabled');
    };

    init();
  };
  refund();

})();
