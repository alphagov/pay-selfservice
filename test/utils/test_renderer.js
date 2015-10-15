var TemplateEngine = require(__dirname + '/../../lib/template-engine.js');

function render(templateName, templateData) {
  var templates = TemplateEngine._getTemplates([__dirname + '/../../app/views',
    __dirname + '/../../govuk_modules/govuk_template/views/layouts']);
  return templates[templateName].render(templateData, templates);
}

module.exports = {
  render: render
};
