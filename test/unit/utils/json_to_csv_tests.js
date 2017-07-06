const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const jsonToCSV = require('../../../app/utils/json_to_csv')

chai.use(chaiAsPromised)

const expect = chai.expect

describe('json2csv module', function () {
  it('should transform JSON data to CSV format', () => {
    const jsonData = JSON.parse('[' +
            '{"amount":12345,"state":{"status":"succeeded","finished":false},"card_brand":"Visa","description":"desc-red","reference":"red","email":"alice.111@mail.fake","links":[],"charge_id":"charge1","gateway_transaction_id":"transaction-1","return_url":"https://demoservice.pymnt.localdomain:443/return/red","payment_provider":"sandbox","created_date":"2016-05-12T16:37:29.245Z","card_details":{"billing_address":{"city":"TEST01","country":"GB","line1":"TEST","line2":"TEST - DO NOT PROCESS","postcode":"SE1 3UZ"},"card_brand":"Visa","cardholder_name":"TEST01","expiry_date":"12/19","last_digits_card_number":"4242"}},' +
            '{"amount":999,"state":{"status":"canceled","finished":true,"code":"P01234","message":"Something happened"},"card_brand":"Mastercard","description":"desc-blue","reference":"blue","email":"alice.222@mail.fake","links":[],"charge_id":"charge2","gateway_transaction_id":"transaction-2","return_url":"https://demoservice.pymnt.localdomain:443/return/blue","payment_provider":"worldpay","created_date":"2015-04-12T18:55:29.999Z","card_details":{"billing_address":{"city":"TEST02","country":"GB","line1":"TEST","line2":"TEST - DO NOT PROCESS","postcode":"SE1 3UZ"},"card_brand":"Mastercard","cardholder_name":"TEST02","expiry_date":"12/19","last_digits_card_number":"4241"}},' +
            '{"amount":1234,"state":{"status":"succeeded","finished":false},"card_brand":"Visa","description":"desc-red","reference":"red","email":"alice.111@mail.fake","links":[],"charge_id":"charge1","gateway_transaction_id":"transaction-1","return_url":"https://demoservice.pymnt.localdomain:443/return/red","payment_provider":"sandbox","created_date":"2016-05-12T16:37:29.245Z","card_details":{"billing_address":{"city":"TEST01","country":"GB","line1":"TEST","line2":"TEST - DO NOT PROCESS","postcode":"SE1 3UZ"},"card_brand":"Visa","cardholder_name":"TEST01","expiry_date":"12/19","last_digits_card_number":"4242"}},' +
            '{"amount":123,"state":{"status":"canceled","finished":true,"code":"P01234","message":"Something happened"},"card_brand":"Mastercard","description":"desc-blue","reference":"blue","email":"alice.222@mail.fake","links":[],"charge_id":"charge2","gateway_transaction_id":"transaction-2","return_url":"https://demoservice.pymnt.localdomain:443/return/blue","payment_provider":"worldpay","created_date":"2015-04-12T18:55:29.999Z","card_details":{"billing_address":{"city":"TEST02","country":"GB","line1":"TEST","line2":"TEST - DO NOT PROCESS","postcode":"SE1 3UZ"},"card_brand":"Mastercard","cardholder_name":"TEST02","expiry_date":"12/19","last_digits_card_number":"4241"}}]')

    const csvDataPromise = jsonToCSV(jsonData)

    const csvDataExpected = `"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Date Created"
"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","succeeded",false,"","","transaction-1","charge1","12 May 2016 — 17:37:29"
"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","canceled",true,"P01234","Something happened","transaction-2","charge2","12 Apr 2015 — 19:55:29"
"red","desc-red","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","succeeded",false,"","","transaction-1","charge1","12 May 2016 — 17:37:29"
"blue","desc-blue","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","canceled",true,"P01234","Something happened","transaction-2","charge2","12 Apr 2015 — 19:55:29"`

    return csvDataPromise.then(csvData => {
      return expect(csvData).to.deep.equal(csvDataExpected)
    })
  })
})
