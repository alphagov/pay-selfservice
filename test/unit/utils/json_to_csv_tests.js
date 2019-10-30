'use strict'

// NPM Dependencies
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local dependencies
const jsonToCSV = require('../../../app/utils/json_to_csv')

// Constants and Setup
chai.use(chaiAsPromised)
const expect = chai.expect
const { transactions, transactionsWithMetadata, refunds } = require('./json/transaction_download_json_to_csv_tests.json')
const COLUMN_NAMES = '"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Issued By","Date Created","Time Created","Corporate Card Surcharge","Total Amount","Wallet Type"'

describe('json2csv module', () => {
  it('should transform JSON data to CSV format for charges without metadata', () => {
    const csvDataPromise = jsonToCSV(transactions)

    const csvDataExpected = `${COLUMN_NAMES},"Card Type"
"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45","","credit"
"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","9.99","","debit"
"red","desc-red","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","12.34","",""
"blue","desc-blue","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23","",""
"red","this charge has Apple Pay","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","12.34","Apple Pay",""`

    return csvDataPromise.then(csvData => {
      return expect(csvData).to.deep.equal(csvDataExpected)
    })
  })

  it('should transform JSON data to CSV format for charges with metadata', () => {
    const csvDataPromise = jsonToCSV([...transactions, ...transactionsWithMetadata])

    const csvDataExpected = `${COLUMN_NAMES},"key1 (metadata)","key2 (metadata)","key3 (metadata)","Card Type"
"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45","","","","","credit"
"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","9.99","","","","","debit"
"red","desc-red","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","12.34","","","","",""
"blue","desc-blue","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23","","","","",""
"red","this charge has Apple Pay","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","12.34","Apple Pay","","","",""
"blue","this charge has metadata 1","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23","","some string","",123,""
"blue","this charge has metadata 2","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23","","some other string",true,"",""`

    return csvDataPromise.then(csvData => {
      return expect(csvData).to.deep.equal(csvDataExpected)
    })
  })

  it('should transform JSON data containing refund to CSV format', () => {
    const csvDataPromise = jsonToCSV([...transactions, ...refunds, ...transactionsWithMetadata])

    const csvDataExpected = `${COLUMN_NAMES},"key1 (metadata)","key2 (metadata)","key3 (metadata)","Card Type"
"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45","","","","","credit"
"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","9.99","","","","","debit"
"red","desc-red","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","12.34","","","","",""
"blue","desc-blue","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23","","","","",""
"red","this charge has Apple Pay","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","12.34","Apple Pay","","","",""
"refund_test","desc-refund","alice.111@mail.fake","-45.67","Visa","TEST01","12/19","4242","Refund success",true,"","","transaction-1","refund1","alice.111@mail.fake","12 May 2016","17:37:29","0.00","-45.67","","","","",""
"blue","this charge has metadata 1","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23","","some string","",123,""
"blue","this charge has metadata 2","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23","","some other string",true,"",""`

    return csvDataPromise.then(csvData => {
      return expect(csvData).to.deep.equal(csvDataExpected)
    })
  })
})
