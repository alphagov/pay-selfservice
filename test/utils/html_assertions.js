var TemplateEngine = require(__dirname + '/../../lib/template-engine.js');
var cheerio = require('cheerio');
var chai = require('chai');

function render(templateName, templateData) {
  var templates = TemplateEngine._getTemplates([__dirname + '/../../app/views',
    __dirname + '/../../govuk_modules/govuk_template/views/layouts']);
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
    utils.flag(this,"rawHtml", this._obj);
    var $ = cheerio.load(this._obj);
    var result = $(selector);
    this.assert(result.length > 0,
        "Expected #{this} to contain '" + selector + "'",
        "Did not expect #{this} to contain '" + selector + "'"
    );
    utils.flag(this, 'selectorId', result.attr("id"));
    this._obj = result;
  });

  chai.Assertion.addMethod('containNoSelector', function (selector) {
    utils.flag(this,"rawHtml", this._obj);
    var $ = cheerio.load(this._obj);
    var result = $(selector);
    this.assert(result.length == 0,
        "Expected #{this} to not contain '" + selector + "'",
        "Expect #{this} to contain '" + selector + "'"
    );
  });

  chai.Assertion.addMethod('withText', function (msg) {
    var actual = this._obj.text();
    this.assert(actual.indexOf(msg) > -1,
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

  chai.Assertion.addMethod('withAttributes', function (attributes) {
    for (var attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        this.withAttribute(attr, attributes[attr]);
      }
    }
  });

  chai.Assertion.addMethod('containInputField', function(idAndName, type) {
    this.containSelector('input#' + idAndName).withAttributes({name: idAndName, type: type})
    utils.flag(this, 'selectorId', idAndName);
  });

  chai.Assertion.addMethod('withLabel', function(labelId, labelText) {
    var selectorId = utils.flag(this, 'selectorId');
    var subAssertion = new chai.Assertion(utils.flag(this, "rawHtml"));
    subAssertion.containSelector('label#' + labelId).withAttribute('for', selectorId).withText(labelText);
  });
  
});