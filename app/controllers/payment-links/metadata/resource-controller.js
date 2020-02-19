const { response } = require('../../../utils/response.js')

const addMetadataPage = function addMetadataPage (req, res, next) {
  // @TODO(sfount) rethink how response works, get repsonse context from library and render _in_ the contrller
  response(req, res, 'payment-links/metadata/edit-metadata')
}

module.exports = {
  addMetadataPage
}
