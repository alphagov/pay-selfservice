'use strict'

const { response } = require('../../utils/response')
const paths = require('../../paths')
const userService = require('../../services/user.service')
const { RESTClientError } = require('../../errors')

function get (req, res) {
  return response(req, res, 'browse-as-a-user/index')
}

async function post (req, res, next) {
  const { body } = req

  const emailAddress = body.emailAddress

  try {
    const userFound = await userService.findUserByEmail(emailAddress)
    req.session.assumedUserId = userFound.externalId
    req.session.assumedUserEmail = userFound.email
    req.flash('generic', `You are now viewing ${userFound.email} services`)
    return res.redirect(paths.serviceSwitcher.index)
  } catch (error) {
    if (error instanceof RESTClientError && error.errorCode === 404) {
      req.flash('genericError', `User with email ${emailAddress} not found`)
    }
    else {
      req.flash('genericError', `Something has gone wrong`)
    }
    return response(req, res, 'browse-as-a-user/index', { emailAddress: emailAddress })
  }
}

function clear (req, res) {
  delete req.session.assumedUserId
  delete req.session.assumedUserEmail

  res.redirect(paths.serviceSwitcher.index)
}

module.exports = {
  get,
  post,
  clear
}
