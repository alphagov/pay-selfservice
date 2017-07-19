var path = require('path')
var TemplateEngine = require(path.join(__dirname, '/../../lib/template-engine.js'))

function render (templateName, templateData) {
  var templates = TemplateEngine._getTemplates([path.join(__dirname, '/../../app/views'), path.join(__dirname, '/../../govuk_modules/govuk_template/views/layouts')])
  return templates[templateName].render(templateData, templates)
}

module.exports = {
  render: render
}
