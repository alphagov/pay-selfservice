const q         = require('q');
const dates     = require('../utils/dates.js');
const logger    = require('winston');
const json2csv  = require('json2csv');
const lodash    = require('lodash');

module.exports = function (data) {

    logger.debug('Converting transactions list from json to csv');
    const defer = q.defer();

    json2csv(
        {
            data: data,
            defaultValue: "",
            fields: [
                ...getSanitisableFields([
                    { label: 'Reference', value: 'reference'},
                    { label: 'Description', value: 'description'},
                    { label: 'Email', value: 'email'}
                ]),
                {
                    label: "Amount",
                    value: row => { return (parseInt(row.amount) / 100).toFixed(2); }
                },
                ...getSanitisableFields([
                    { label: 'Card Brand', value: 'card_details.card_brand'},
                    { label: 'Cardholder Name', value: 'card_details.cardholder_name'},
                    { label: 'Card Expiry Date', value: 'card_details.expiry_date'},
                    { label: 'Card Number', value: 'card_details.last_digits_card_number'},
                    { label: 'State', value: 'state.status'},
                    { label: 'Finished', value: 'state.finished'},
                    { label: 'Error Code', value: 'state.code'},
                    { label: 'Error Message', value: 'state.message'},
                    { label: 'Provider ID', value: 'gateway_transaction_id'},
                    { label: 'GOV.UK Payment ID', value: 'charge_id'}
                ]),
                {
                    label: 'Date Created',
                    value: row => { return dates.utcToDisplay(row.created_date); }
                }
            ]
        },
        (err, csv) => {
            if (err) defer.reject();
            defer.resolve(csv);
        });
    return defer.promise;
};

const sanitiseAgainstSpreadsheetFormulaInjection = fieldValue => {
    if (typeof(fieldValue) !== 'string') { return fieldValue; }
    const injectionTriggerRegexp = /(^[=@+-])/g;
    return fieldValue.replace(injectionTriggerRegexp, "'$1");
};

const getSanitisableFields = fieldArray => {
    let ret = [];
    for(let i = 0; i < fieldArray.length; i++) {
        let theField = fieldArray[i];
        ret.push({
            label: theField.label,
            value: function(row) {
                if (lodash.has(row, theField.value)) return sanitiseAgainstSpreadsheetFormulaInjection(lodash.get(row, theField.value));
                return null;
            }
        });
    }
    return ret;
};






