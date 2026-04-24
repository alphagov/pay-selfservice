require('module-alias/register')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../test.env') })
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const chai = require('chai')
const nock = require('nock')
const sinon = require('sinon')
chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)
const { Settings } = require('luxon')

Settings.defaultLocale = 'en-GB'
Settings.defaultZone = 'Europe/London'

afterEach(() => {
  sinon.resetHistory()
  nock.cleanAll()
})
