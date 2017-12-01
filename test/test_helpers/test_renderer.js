const nunjucks = require('nunjucks')
const views = ['./app/views', './govuk_modules/govuk_template/views/layouts']
const environment = nunjucks.configure(views)

function render (templateName, templateData) {
  const pathToTemplate = templateName + '.njk'
  return environment.render(pathToTemplate, templateData)
}

module.exports = {
  render: render
}
