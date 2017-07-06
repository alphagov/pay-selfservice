const path = require('path')
const TemplateEngine = require(path.join(__dirname, '/../../lib/template-engine.js'))
const cheerio = require('cheerio')
const chai = require('chai')
const router = require('../../app/routes.js')

function render (templateName, templateData) {
  let templates = TemplateEngine._getTemplates([path.join(__dirname, '/../../app/views'), path.join(__dirname, '/../../govuk_modules/govuk_template/views/layouts')])
  templateData.routes = router.paths
  return templates[templateName].render(templateData, templates)
}

module.exports = {
  render: render
}

chai.use(function (_chai, utils) {
  // See http://chaijs.com/guide/plugins/ and http://chaijs.com/guide/helpers/

  // Flags:
  // rawHtml: The raw html passed into containSelector
  // obj: Cheerio parsed rawHtml.
  // selectorId: The id of the last selection

  chai.Assertion.addMethod('containSelector', function (selector) {
    utils.flag(this, 'rawHtml', this._obj)
    let $ = cheerio.load(this._obj)
    let result = $(selector)
    this.assert(result.length > 0,
      "Expected #{this} to contain '" + selector + "'",
      "Did not expect #{this} to contain '" + selector + "'"
    )
    utils.flag(this, 'selectorId', result.attr('id'))
    this._obj = result
  })

  chai.Assertion.addMethod('containNoSelector', function (selector) {
    utils.flag(this, 'rawHtml', this._obj)
    let $ = cheerio.load(this._obj)
    let result = $(selector)
    this.assert(result.length === 0,
      "Expected #{this} to not contain '" + selector + "'",
      "Expect #{this} to contain '" + selector + "'"
    )
  })

  chai.Assertion.addMethod('containNoSelectorWithText', function (selector, text) {
    utils.flag(this, 'rawHtml', this._obj)
    let $ = cheerio.load(this._obj)
    let result = $(selector)
    this.assert(result.text().indexOf(text) === -1,
      "Expected #{result} to not contain '" + text + "'",
      "Expect #{result} to contain '" + text + "'"
    )
  })

  chai.Assertion.addMethod('withText', function (msg) {
    let actual = this._obj.text()
    this.assert(actual.indexOf(msg) > -1,
      "Expected #{act} to contain '" + msg + "'.",
      "Did not expect #{act} to contain '" + msg + "'.",
      msg,
      actual
    )
  })

  chai.Assertion.addMethod('withExactText', function (msg) {
    let actual = this._obj.text()
    this.assert(actual === msg,
      "Expected #{act} to contain '" + msg + "'.",
      "Did not expect #{act} to contain '" + msg + "'.",
      msg,
      actual
    )
  })

  chai.Assertion.addMethod('withOnlyText', function (msg) {
    let actual = this._obj.contents().filter(function () { return this.nodeType === 3 }).text()
    this.assert(actual.trim() === msg,
      "Expected #{act} to contain '" + msg + "'.",
      "Did not expect #{act} to contain '" + msg + "'.",
      msg,
      actual
    )
  })

  chai.Assertion.addMethod('withAttribute', function (expectedAttr, expectedValue) {
    this.assert(this._obj.attr(expectedAttr) !== undefined,
      "Expected #{act} to contain '" + expectedAttr + "'",
      "Did not expect #{act} to contain '" + expectedAttr + "'",
      expectedAttr,
      JSON.stringify(this._obj['0'].attribs)
    )

    if (arguments.length === 2) {
      this.assert(this._obj.attr(expectedAttr) === expectedValue,
        "Expected #{act} to contain '" + expectedAttr + "' with value '" + expectedValue + "'",
        "Did not expect #{act} to contain '" + expectedAttr + "' with value '" + expectedValue + "'",
        expectedAttr,
        JSON.stringify(this._obj['0'].attribs)
      )
    }
  })

  chai.Assertion.addMethod('withNoAttribute', function (expectedNoAttr) {
    this.assert(this._obj.attr(expectedNoAttr) === undefined,
      "Expected #{act} to no contain '" + expectedNoAttr + "'",
      "Did not expect #{act} to contain '" + expectedNoAttr + "'",
      expectedNoAttr,
      JSON.stringify(this._obj['0'].attribs)
    )
  })

  chai.Assertion.addMethod('withAttributes', function (attributes) {
    for (let attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        this.withAttribute(attr, attributes[attr])
      }
    }
  })

  chai.Assertion.addMethod('withALinkTo', function (url) {
    let link = this._obj.find('a')
    this.assert(link.length > 0, 'Expected #{act} to contain a link')
    this.assert(link.attr('href') === url, 'Expected ' + link.attr('href') + ' to match ' + url)
  })

  chai.Assertion.addMethod('withNoLink', function () {
    let link = this._obj.find('a')
    this.assert(link.length === 0, 'Expected #{act} to not contain a link')
  })

  chai.Assertion.addMethod('containInputField', function (idAndName, type) {
    this.containSelector('input#' + idAndName).withAttributes({name: idAndName, type: type})
    utils.flag(this, 'inputId', idAndName)
  })

  chai.Assertion.addMethod('containTextarea', function (idAndName) {
    this.containSelector('textarea#' + idAndName).withAttributes({name: idAndName})
    utils.flag(this, 'inputId', idAndName)
  })

  chai.Assertion.addMethod('withLabel', function (labelText) {
    let inputId = utils.flag(this, 'inputId')
    let subAssertion = new chai.Assertion(utils.flag(this, 'rawHtml'))
    subAssertion.containSelector('label[for=' + inputId + ']').withText(labelText)
  })

  chai.Assertion.addMethod('havingRowAt', function (rowIndex) {
    let actualRow = this._obj.find('tbody > tr:nth-child(' + rowIndex + ')')
    this.assert(actualRow.length > 0, "Expected a row at index '" + rowIndex + "'")
    this._obj = actualRow
  })

  chai.Assertion.addMethod('havingItemAt', function (itemIndex) {
    let actualItem = this._obj.find('ul li:nth-child(' + itemIndex + ')')
    this.assert(actualItem.length > 0, "Expected a item at index '" + itemIndex + "'")
    this._obj = actualItem
  })

  chai.Assertion.addMethod('havingNumberOfRows', function (expectedNumberOfRows) {
    let rows = this._obj.find('tbody tr')
    this.assert(rows.length === expectedNumberOfRows, "Expected number of rows to be '" + expectedNumberOfRows + "' but found '" + rows.length + "'")
  })

  chai.Assertion.addMethod('havingNumberOfItems', function (expectedNumberOfItems) {
    let items = this._obj.find('li')
    this.assert(items.length === expectedNumberOfItems, "Expected number of items to be '" + expectedNumberOfItems + "' but found '" + items.length + "'")
  })

  chai.Assertion.addMethod('withTableDataAt', function (colIndex, expectedValue) {
    let actualValue = this._obj.find('td:nth-child(' + colIndex + ')').text().trim()
    this.assert(actualValue === expectedValue.toString(),
      "Expected '" + actualValue + "' to be '" + expectedValue + "'.",
      expectedValue, actualValue
    )
  })
})
