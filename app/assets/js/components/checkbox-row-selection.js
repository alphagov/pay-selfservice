(function(){
  checkboxRowSelection = function(){

    var init = function(){
        $('.checkbox-row-selection tr').click(function(event) {
          if (event.target.type !== 'checkbox') {
            $(':checkbox', this).trigger('click');
          }
        });
    };

    init();
  }

  checkboxRowSelection();

})();

