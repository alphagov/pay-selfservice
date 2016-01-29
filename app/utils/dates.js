var moment = require('moment');

module.exports = function()
{

  var userInputToApiFormat = function(date){
    return (date) ? moment(date,'DD/M/YYYY').format("YYYY-MM-DD HH:mm:ss") : "";
  };

  var utcToDisplay = function(date){
    return moment(date).format('DD MMM YYYY — HH:mm')
  }

  return {
    userInputToApiFormat: userInputToApiFormat,
    utcToDisplay: utcToDisplay
  }

}();
