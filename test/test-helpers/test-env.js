require('module-alias/register')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../test.env') })
const sinonChai = require('sinon-chai')
const chai = require('chai')
chai.should()
chai.use(sinonChai)
