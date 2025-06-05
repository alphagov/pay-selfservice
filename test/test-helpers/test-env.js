require('module-alias/register')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../test.env') })
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const chai = require('chai')
const nock = require('nock')
chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)

afterEach(() => {
  nock.cleanAll()
})
