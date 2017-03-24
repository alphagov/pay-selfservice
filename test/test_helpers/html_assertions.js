let TemplateEngine = require(__dirname + '/../../lib/template-engine.js');
let cheerio = require('cheerio');
let chai = require('chai');
let router = require('../../app/routes.js');

function render(templateName, templateData) {
  let templates = TemplateEngine._getTemplates([__dirname + '/../../app/views']);
  templateData.routes = router.paths;
  return templates[templateName].render(templateData, templates);
}

module.exports = {
  render: render
};

chai.use(function (_chai, utils) {
  // See http://chaijs.com/guide/plugins/ and http://chaijs.com/guide/helpers/

  // Flags:
  // rawHtml: The raw html passed into containSelector
  // obj: Cheerio parsed rawHtml.
  // selectorId: The id of the last selection

  chai.Assertion.addMethod('containSelector', function (selector) {
    utils.flag(this, "rawHtml", this._obj);
    let $ = cheerio.load(this._obj);
    let result = $(selector);
    this.assert(result.length > 0,
      "Expected #{this} to contain '" + selector + "'",
      "Did not expect #{this} to contain '" + selector + "'"
    );
    utils.flag(this, 'selectorId', result.attr("id"));
    this._obj = result;
  });

  chai.Assertion.addMethod('containNoSelector', function (selector) {
    utils.flag(this, "rawHtml", this._obj);
    let $ = cheerio.load(this._obj);
    let result = $(selector);
    this.assert(result.length == 0,
      "Expected #{this} to not contain '" + selector + "'",
      "Expect #{this} to contain '" + selector + "'"
    );
  });

  chai.Assertion.addMethod('containNoSelectorWithText', function (selector, text) {
    utils.flag(this, "rawHtml", this._obj);
    let $ = cheerio.load(this._obj);
    let result = $(selector);
    this.assert(result.text().indexOf(text) == -1,
      "Expected #{result} to not contain '" + text + "'",
      "Expect #{result} to contain '" + text + "'"
    );
  });

  chai.Assertion.addMethod('withText', function (msg) {
    let actual = this._obj.text();
    this.assert(actual.indexOf(msg) > -1,
      "Expected #{act} to contain '" + msg + "'.",
      "Did not expect #{act} to contain '" + msg + "'.",
      msg,
      actual
    );
  });

  chai.Assertion.addMethod('withExactText', function (msg) {
    let actual = this._obj.text();
    this.assert(actual == msg,
      "Expected #{act} to contain '" + msg + "'.",
      "Did not expect #{act} to contain '" + msg + "'.",
      msg,
      actual
    );
  });

  chai.Assertion.addMethod('withAttribute', function (expectedAttr, expectedValue) {
    this.assert(this._obj.attr(expectedAttr) !== undefined,
      "Expected #{act} to contain '" + expectedAttr + "'",
      "Did not expect #{act} to contain '" + expectedAttr + "'",
      expectedAttr,
      JSON.stringify(this._obj['0'].attribs)
    );

    if (arguments.length == 2) {
      this.assert(this._obj.attr(expectedAttr) === expectedValue,
        "Expected #{act} to contain '" + expectedAttr + "' with value '" + expectedValue + "'",
        "Did not expect #{act} to contain '" + expectedAttr + "' with value '" + expectedValue + "'",
        expectedAttr,
        JSON.stringify(this._obj['0'].attribs)
      );
    }
  });

  chai.Assertion.addMethod('withNoAttribute', function (expectedNoAttr) {
    this.assert(this._obj.attr(expectedNoAttr) == undefined,
      "Expected #{act} to no contain '" + expectedNoAttr + "'",
      "Did not expect #{act} to contain '" + expectedNoAttr + "'",
      expectedNoAttr,
      JSON.stringify(this._obj['0'].attribs)
    );
  });

  chai.Assertion.addMethod('withAttributes', function (attributes) {
    for (let attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        this.withAttribute(attr, attributes[attr]);
      }
    }
  });

  chai.Assertion.addMethod('containInputField', function (idAndName, type) {
    this.containSelector('input#' + idAndName).withAttributes({name: idAndName, type: type});
    utils.flag(this, 'inputId', idAndName);
  });

  chai.Assertion.addMethod('containTextarea', function (idAndName) {
    this.containSelector('textarea#' + idAndName).withAttributes({name: idAndName});
    utils.flag(this, 'inputId', idAndName);
  });

  chai.Assertion.addMethod('withLabel', function (labelText) {
    let inputId = utils.flag(this, 'inputId');
    let subAssertion = new chai.Assertion(utils.flag(this, "rawHtml"));
    subAssertion.containSelector('label[for=' + inputId + ']').withText(labelText);
  });

  chai.Assertion.addMethod('havingRowAt', function (rowIndex) {
    let actualRow = this._obj.find('tbody > tr:nth-child(' + rowIndex + ')');
    this.assert(actualRow.length > 0, "Expected a row at index '" + rowIndex + "'");
    this._obj = actualRow;
  });

  chai.Assertion.addMethod('havingNumberOfRows', function (expectedNumberOfRows) {
    let rows = this._obj.find('tbody tr');
    this.assert(rows.length == expectedNumberOfRows, "Expected number of rows to be '" + expectedNumberOfRows + "' but found '" + rows.length + "'");
  });

  chai.Assertion.addMethod('withTableDataAt', function (colIndex, expectedValue) {
    let actualValue = this._obj.find('td:nth-child(' + colIndex + ')').text().trim();
    this.assert(actualValue === expectedValue.toString(),
      "Expected '" + actualValue + "' to be '" + expectedValue + "'.",
      expectedValue, actualValue
    );
  });
});
