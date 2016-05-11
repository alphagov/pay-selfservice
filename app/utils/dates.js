var moment = require('moment-timezone');

module.exports = function () {

  var DEFAULT_FORMAT = "YYYY-MM-DD HH:mm:ss";
  var API_FORMAT = "YYYY-MM-DD HH:mm:ss";

  var dateToDefaultFormat = function(date){
    return moment(date).tz('Europe/London').format(DEFAULT_FORMAT);
  };

  var userInputToApiFormat = function (date) {
    return (date) ? moment(date, 'DD/M/YYYY').toISOString() : "";
  };

  var utcToDisplay = function (date) {
    return moment(date).tz('Europe/London').format('DD MMM YYYY — HH:mm:ss')
  }

  return {
    dateToDefaultFormat: dateToDefaultFormat,
    userInputToApiFormat: userInputToApiFormat,
    utcToDisplay: utcToDisplay
  }

}();
