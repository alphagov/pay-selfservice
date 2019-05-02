'use strict'

// NPM Dependencies
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local dependencies
const jsonToCSV = require('../../../app/utils/json_to_csv')

// Constants and Setup
chai.use(chaiAsPromised)
const expect = chai.expect

describe('json2csv module', () => {
  it('should transform JSON data to CSV format', () => {
    const { transactions } = require('./json/transaction_download_json_to_csv_tests.json')

    const csvDataPromise = jsonToCSV(transactions)

    const csvDataExpected = `"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Issued By","Date Created","Time Created","Corporate Card Surcharge","Total Amount","Wallet Type"
"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45",""
"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","9.99",""
"red","desc-red","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","12.34",""
"blue","desc-blue","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23",""
"red","desc-red","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","12.34","Apple Pay"`

    return csvDataPromise.then(csvData => {
      return expect(csvData).to.deep.equal(csvDataExpected)
    })
  })

  it('should transform JSON data containing refund to CSV format', () => {
    const { transactionsWithRefunds } = require('./json/transaction_download_json_to_csv_tests.json')
    
    const csvDataPromise = jsonToCSV(transactionsWithRefunds)

    const csvDataExpected = `"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Issued By","Date Created","Time Created","Corporate Card Surcharge","Total Amount","Wallet Type"
"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45",""
"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","9.99",""
"red","desc-red","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","12.34",""
"refund_test","desc-refund","alice.111@mail.fake","-45.67","Visa","TEST01","12/19","4242","Refund success",true,"","","transaction-1","refund1","alice.111@mail.fake","12 May 2016","17:37:29","0.00","-45.67",""
"blue","desc-blue","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23",""`

    return csvDataPromise.then(csvData => {
      return expect(csvData).to.deep.equal(csvDataExpected)
    })
  })
})
