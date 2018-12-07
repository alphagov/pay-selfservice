'use strict'

// npm dependencies
const logger = require('winston')
const json2csv = require('json2csv')
const lodash = require('lodash')

// local dependencies
const dates = require('../utils/dates.js')
const states = require('../utils/states')

// constants
const injectionTriggerRegexp = /(^[=@+-])/g

const sanitiseAgainstSpreadsheetFormulaInjection = fieldValue => {
  if (typeof (fieldValue) !== 'string') {
    return fieldValue
  }
  return fieldValue.replace(injectionTriggerRegexp, '\'$1')
}

const getSanitisableFields = fieldArray => {
  let ret = []
  for (let i = 0; i < fieldArray.length; i++) {
    let theField = fieldArray[i]
    ret.push({
      label: theField.label,
      value: function (row) {
        if (lodash.has(row, theField.value)) return sanitiseAgainstSpreadsheetFormulaInjection(lodash.get(row, theField.value))
        return null
      }
    })
  }
  return ret
}

module.exports = function (data) {
  return new Promise(function (resolve, reject) {
    logger.debug('Converting transactions list from json to csv')
    try {
      const parseFields = [
        ...getSanitisableFields([
          {label: 'Reference', value: 'reference'},
          {label: 'Description', value: 'description'},
          {label: 'Email', value: 'email'}
        ]),
        {
          label: 'Amount',
          value: row => {
            return (row.transaction_type === 'refund') ? (parseInt(row.amount) * -1 / 100).toFixed(2) : (parseInt(row.amount) / 100).toFixed(2)
          }
        },
        ...getSanitisableFields([
          {label: 'Card Brand', value: 'card_details.card_brand'},
          {label: 'Cardholder Name', value: 'card_details.cardholder_name'},
          {label: 'Card Expiry Date', value: 'card_details.expiry_date'},
          {label: 'Card Number', value: 'card_details.last_digits_card_number'}
        ]),
        {
          label: 'State',
          value: row => {
            return states.getDisplayNameForConnectorState(row.state, row.transaction_type)
          }
        },
        ...getSanitisableFields([
          {label: 'Finished', value: 'state.finished'},
          {label: 'Error Code', value: 'state.code'},
          {label: 'Error Message', value: 'state.message'},
          {label: 'Provider ID', value: 'gateway_transaction_id'},
          {label: 'GOV.UK Payment ID', value: 'charge_id'},
          {label: 'Issued By', value: 'refund_summary.user_username'}
        ]),
        {
          label: 'Date Created',
          value: row => {
            return dates.utcToDate(row.created_date)
          }
        },
        {
          label: 'Time Created',
          value: row => {
            return dates.utcToTime(row.created_date)
          }
        },
        {
          label: 'Corporate Card Surcharge',
          value: row => {
            const amountInPence = row.corporate_card_surcharge ? row.corporate_card_surcharge : 0
            return (parseInt(amountInPence) / 100).toFixed(2)
          }
        },
        {
          label: 'Total Amount',
          value: row => {
            const amountInPence = row.total_amount ? row.total_amount : row.amount
            return (row.transaction_type === 'refund') ? (parseInt(amountInPence) * -1 / 100).toFixed(2) : (parseInt(amountInPence) / 100).toFixed(2)
          }
        }
      ]
      return resolve(json2csv.parse(
        data, {
          defaultValue: '',
          fields: parseFields
        }))
    } catch (err) {
      reject(err)
    }
  })
}
