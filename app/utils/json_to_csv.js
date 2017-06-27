var q         = require('q');
var dates     = require('../utils/dates.js');
var logger    = require('winston');
var json2csv  = require('json2csv');



module.exports = function (data) {

  logger.debug('Converting transactions list from json to csv');
  var defer = q.defer();

  var sanitiseAgainstSpreadsheetFormulaInjection = function(fieldValue) {

        if (typeof(fieldValue) !== 'string') { return fieldValue; }

        var escapingCharacter = "'";

        var injectionTriggerCharacters = ['=', '@', '+', '-'];

        for (var i = 0; i < injectionTriggerCharacters.length; i++) {
            injectionTriggerCharacter = injectionTriggerCharacters[i];
            if (fieldValue.startsWith(injectionTriggerCharacter)) {
                fieldValue = escapingCharacter + fieldValue;
                break;
            }
        }

        return fieldValue;
  }

  json2csv(
    {
      data: data,
      defaultValue: "",
      fields: [
        {
          label: 'Reference',
            value: function(row) {
                return sanitiseAgainstSpreadsheetFormulaInjection(row.reference);
            }
        },
        {
          label: 'Description',
          value: function(row) {
            return sanitiseAgainstSpreadsheetFormulaInjection(row.description);
          }
        },
        {
          label: 'Email',
            value: function(row) {
                return sanitiseAgainstSpreadsheetFormulaInjection(row.email);
            }
        },
        {
          label: "Amount",
          value: function (row) {
            return (parseInt(row.amount) / 100).toFixed(2);
          }
        },
        {
          label: 'Card Brand',
            value: function(row) {
                return row.card_details
                    ? sanitiseAgainstSpreadsheetFormulaInjection(row.card_details.card_brand)
                    : null;

            }
        },
        {
          label: 'Cardholder Name',
            value: function(row) {
                return row.card_details
                    ? sanitiseAgainstSpreadsheetFormulaInjection(row.card_details.cardholder_name)
                    : null;
            }
        },
        {
          label: 'Card Expiry Date',
            value: function(row) {
                return row.card_details
                    ? sanitiseAgainstSpreadsheetFormulaInjection(row.card_details.expiry_date)
                    : null;
            }
        },
        {
          label: 'Card Number',
            value: function(row) {
                return  row.card_details
                    ? sanitiseAgainstSpreadsheetFormulaInjection(row.card_details.last_digits_card_number)
                    : null;
            }
        },
        {
          label: 'State',
            value: function(row) {
                return  row.state
                    ? sanitiseAgainstSpreadsheetFormulaInjection(row.state.status)
                    : null;
            }
        },
        {
          label: 'Finished',
            value: function(row) {
                return  row.state
                    ? sanitiseAgainstSpreadsheetFormulaInjection(row.state.finished)
                    : null;
            }
        },
        {
          label: 'Error Code',
            value: function(row) {
                return  row.state
                    ? sanitiseAgainstSpreadsheetFormulaInjection(row.state.code)
                    : null;
            }
        },
        {
          label: 'Error Message',
            value: function(row) {
                return sanitiseAgainstSpreadsheetFormulaInjection(row.state.message);
            }
        },
        {
          label: 'Provider ID',
            value: function(row) {
                return sanitiseAgainstSpreadsheetFormulaInjection(row.gateway_transaction_id);
            }
        },
        {
          label: 'GOV.UK Payment ID',
            value: function(row) {
                return sanitiseAgainstSpreadsheetFormulaInjection(row.charge_id);
            }
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






