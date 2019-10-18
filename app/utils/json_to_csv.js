'use strict'

// NPM Dependencies
const json2csv = require('json2csv')
const lodash = require('lodash')
const changeCase = require('change-case')

// Local dependencies
const logger = require('./logger')(__filename)
const dates = require('./dates')
const states = require('./states')
const { penceToPounds } = require('./currency_formatter')

// Constants
const injectionTriggerRegexp = /(^[=@+-])/g
const MAX_METADATA_COLUMNS = 100

const sanitiseAgainstSpreadsheetFormulaInjection = fieldValue => {
  if (typeof (fieldValue) !== 'string') {
    return fieldValue
  }
  return fieldValue.replace(injectionTriggerRegexp, '\'$1')
}

const getSanitisableFields = fieldArray => {
  const ret = []
  for (let i = 0; i < fieldArray.length; i++) {
    const theField = fieldArray[i]
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

module.exports = function jsonToCSV (data, supportsGatewayFees = false) {
  const createCsvFieldFromMetadataKey = function (key) {
    return {
      label: `${key} (metadata)`,
      value: row => {
        return row.metadata ? row.metadata[key] : null
      }
    }
  }

  const getUniqueMetadataKeys = function (charges) {
    return [...charges.reduce((uniqueKeys, charge) => {
      if (charge.metadata) {
        Object.keys(charge.metadata).forEach((key) => uniqueKeys.add(key))
      }
      return uniqueKeys
    }, new Set())]
  }

  const getMetadataFields = function (charges) {
    return getUniqueMetadataKeys(charges)
      .sort()
      .slice(0, MAX_METADATA_COLUMNS)
      .reduce((csvFields, metadataKey) => {
        csvFields.push(createCsvFieldFromMetadataKey(metadataKey))
        return csvFields
      }, [])
  }

  return new Promise(function (resolve, reject) {
    logger.debug('Converting transactions list from json to csv')
    try {
      const parseFields = [
        ...getSanitisableFields([
          { label: 'Reference', value: 'reference' },
          { label: 'Description', value: 'description' },
          { label: 'Email', value: 'email' }
        ]),
        {
          label: 'Amount',
          value: row => {
            return (row.transaction_type && row.transaction_type.toLowerCase() === 'refund') ? penceToPounds(parseInt(row.amount) * -1) : penceToPounds(parseInt(row.amount))
          }
        },
        ...getSanitisableFields([
          { label: 'Card Brand', value: 'card_details.card_brand' },
          { label: 'Cardholder Name', value: 'card_details.cardholder_name' },
          { label: 'Card Expiry Date', value: 'card_details.expiry_date' },
          { label: 'Card Number', value: 'card_details.last_digits_card_number' }
        ]),
        {
          label: 'State',
          value: row => {
            return states.getDisplayNameForConnectorState(row.state, row.transaction_type)
          }
        },
        ...getSanitisableFields([
          { label: 'Finished', value: 'state.finished' },
          { label: 'Error Code', value: 'state.code' },
          { label: 'Error Message', value: 'state.message' },
          { label: 'Provider ID', value: 'gateway_transaction_id' },
          { label: 'GOV.UK Payment ID', value: 'charge_id' },
          { label: 'Issued By', value: 'refund_summary.user_username' }
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
            return penceToPounds(parseInt(amountInPence))
          }
        },
        {
          label: 'Total Amount',
          value: row => {
            const amountInPence = row.total_amount ? row.total_amount : row.amount
            return (row.transaction_type && row.transaction_type.toLowerCase() === 'refund') ? penceToPounds(parseInt(amountInPence) * -1) : penceToPounds(parseInt(amountInPence))
          }
        },
        {
          label: 'Wallet Type',
          value: row => {
            return changeCase.titleCase(row.wallet_type)
          }
        },
        ...supportsGatewayFees ? [
          { label: 'Fee', value: row => row.fee && penceToPounds(parseInt(row.fee)) },
          {
            label: 'Net',
            value: row => {
              const amountInPence = row.net_amount || row.total_amount || row.amount
              return (row.transaction_type && row.transaction_type.toLowerCase() === 'refund') ? penceToPounds(parseInt(amountInPence) * -1) : penceToPounds(parseInt(amountInPence))
            }
          }
        ] : [],
        ...getMetadataFields(data)
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
