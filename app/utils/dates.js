var moment = require('moment');

module.exports = function () {

  var DEFAULT_FORMAT = "YYYY-MM-DD HH:mm:ss";
  var MAX_TIME = "23:59:59";

  var dateToDefaultFormat = function(date){
    return moment(date).tz('Europe/London').format(DEFAULT_FORMAT);
  };

  var fromDateToApiFormat = function (date, time) {
    return (date) ? moment.tz(`${date} ${time}`, 'DD/M/YYYY HH:mm:ss', 'Europe/London').toISOString() : "";
  };

  var toDateToApiFormat = function (date, time) {
    var fixedTime = time;

    if (!time ) {
      fixedTime = MAX_TIME;
    }

    return (date) ? moment.tz(`${date} ${fixedTime}`, 'DD/M/YYYY HH:mm:ss', 'Europe/London').add(1, 'second').toISOString() : "";
  };

  var utcToDisplay = function (date) {
    return moment(date).tz('Europe/London').format('DD MMM YYYY — HH:mm:ss')
  }

  return {
    dateToDefaultFormat: dateToDefaultFormat,
    fromDateToApiFormat: fromDateToApiFormat,
    toDateToApiFormat: toDateToApiFormat,
    utcToDisplay: utcToDisplay
  }

}();
