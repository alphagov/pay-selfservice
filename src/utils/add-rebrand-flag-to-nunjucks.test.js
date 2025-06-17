const { expect } = require('chai')
const sinon = require('sinon')

const addRebrandFlagToNunjucks = require('./add-rebrand-flag-to-nunjucks.js')

const nunjucksEnvironment = {
  addGlobal: sinon.spy()
}

describe('Add rebrand flag to Nunjucks environment', function () {
  beforeEach(function () {
    process.env.ENABLE_REBRAND = undefined
    nunjucksEnvironment.addGlobal.resetHistory()
  })

  it('should NOT set the Nunjucks rebrand global variable when process.env.ENABLE_REBRAND = undefined', function () {
    addRebrandFlagToNunjucks(nunjucksEnvironment)
    expect(nunjucksEnvironment.addGlobal.called).to.equal(false)
  })

  it('should set the Nunjucks rebrand global variable when process.env.ENABLE_REBRAND = true', function () {
    process.env.ENABLE_REBRAND = 'true'
    addRebrandFlagToNunjucks(nunjucksEnvironment)
    expect(nunjucksEnvironment.addGlobal.calledWithExactly('govukRebrand', true)).to.equal(true)
  })

  it('should NOT set the Nunjucks rebrand global variable when process.env.ENABLE_REBRAND = false', function () {
    process.env.ENABLE_REBRAND = 'false'
    addRebrandFlagToNunjucks(nunjucksEnvironment)
    expect(nunjucksEnvironment.addGlobal.called).to.equal(false)
  })
})
