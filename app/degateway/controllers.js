const express = require('express')
const userIsAuthorised = require('../middleware/user-is-authorised')
const router = express.Router()

router.get('/my-services', [ userIsAuthorised ], (req, res) => {
  res.send("Hello degatewayification!")
})

module.exports = {
  router
}
