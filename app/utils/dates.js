var moment = require('moment');

module.exports = function()
{

  var userInputToApiFormat = function(date){
    return (date) ? moment(date,'DD/M/YYYY').format("YYYY-MM-DD HH:mm:ss") : "";
  };

  return {
    userInputToApiFormat: userInputToApiFormat
  }

}();
