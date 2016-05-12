var q = require('q');
var json2csv = require('json2csv');

module.exports = function(data){
  var defer = q.defer();
  json2csv(
  {
    data: data,
    default: "NULL",
    fields:
    [
    {
      label: "Charge id",
      value: "charge_id",
    },
    {
      label: "Gateway transaction id",
      value: "gateway_transaction_id",
    },
    {
      label: "Amount",
      value: function(row){ return (parseInt(row.amount) / 100).toFixed(2);},
    },
    {
      label: "State",
      value: "state.status",
    },
    {
      label: "Finished",
      value: "state.finished",
    },
    {
      label: "Error code",
      value: "state.code",
    },
    {
      label: "Error message",
      value: "state.message",
    },
    {
      label: "Status",
      value: "status",
    }
    ]
  },
  function(err, csv) {
    if (err) defer.reject();
    defer.resolve(csv);
  });
  return defer.promise;
};






