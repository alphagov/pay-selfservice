var q         = require('q');
var dates     = require('../utils/dates.js');
var logger    = require('winston');
var json2csv  = require('json2csv');

module.exports = function (data) {
  logger.debug('Converting transactions list from json to csv');
  var defer = q.defer();
  json2csv(
    {
      data: data,
      default: 'NULL',
      quotes: "",
      fields: [
        {
          label: 'Reference',
          value: "reference"
        },
        {
          label: 'Description',
          value: "description"
        },
        {
          label: 'Email',
          value: "email"
        },
        {
          label: "Amount",
          value: function (row) {
            return (parseInt(row.amount) / 100).toFixed(2);
          }
        },
        {
          label: 'Card Brand',
          value: "card_details.card_brand"
        },
        {
          label: 'Cardholder Name',
          value: "card_details.cardholder_name"
        },
        {
          label: 'Card Expiry Date',
          value: "card_details.expiry_date"
        },
        {
          label: 'Card Number',
          value: "card_details.last_digits_card_number"
        },
        {
          label: 'State',
          value: "state.status"
        },
        {
          label: 'Finished',
          value: "state.finished"
        },
        {
          label: 'Error Code',
          value: "state.code"
        },
        {
          label: 'Error Message',
          value: "state.message"
        },
        {
          label: 'Provider ID',
          value: "gateway_transaction_id"
        },
        {
          label: 'GOV.UK Payment ID',
          value: "charge_id"
        },
        {
          label: 'Date Created',
          value: function (row) {
            return dates.utcToDisplay(row.created_date);
          }
        }
      ]
    },
    function (err, csv) {
      if (err) defer.reject();
      defer.resolve(csv);
    });
  return defer.promise;
};






