(function () {
  datetimePicker = function () {
    var init = function () {
        datePicker();
        timePicker();
      },

      datePicker = function () {
        $('.date-picker').datepicker({
          'format': 'dd/mm/yyyy',
          'autoclose': true
        });
      },

      timePicker = function () {
        $('.time-picker').timepicker({
          'showDuration': true,
          'timeFormat': 'G:i:s',
          'roundingFunction': function () {return null;}
        });
      }

    datePair = function () {
      $('.datetime-pair').datepair({
        'dateClass': 'date-picker',
        'timeClass': 'time-picker'
      });
    }

    init();
  }
  datetimePicker();

})();

