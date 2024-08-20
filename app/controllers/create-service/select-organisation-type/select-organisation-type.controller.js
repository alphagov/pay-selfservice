const _ = require('lodash')
const paths = require('../../../paths')
const { response } = require('../../../utils/response')
const {
  validateMandatoryField,
  SERVICE_NAME_MAX_LENGTH,
  validateOptionalField
} = require('../../../utils/validation/server-side-form-validations')
const logger = require('../../../utils/logger')(__filename)

function get (req, res) {
  const createServiceState = _.get(req, 'session.pageData.createService', {})
  if (!createServiceState.current_name) {
    logger.info('Page accessed out of sequence, redirecting to my-services/create')
    return res.redirect(paths.serviceSwitcher.create.index)
  }
  const context = {
    ...createServiceState,
    back_link: paths.serviceSwitcher.create.index,
    submit_link: paths.serviceSwitcher.create.index
  }
  _.unset(req, 'session.pageData.createService.errors')
  return response(req, res, 'services/select-org-type', context)
}

function post (req, res) {
  _.set(req, 'session.pageData.createService', {
    current_name: req.body['service-name'],
    service_selected_cy: req.body['welsh-service-name-bool'],
    current_name_cy: req.body['service-name-cy']
  })
  const errors = validateServiceName(req.body['service-name'], req.body['service-name-cy'])
  if (!_.isEmpty(errors)) {
    _.set(req, 'session.pageData.createService.errors', errors)
    return res.redirect(paths.serviceSwitcher.create.index)
  }
  const context = {
    back_link: paths.serviceSwitcher.create.index,
    submit_link: paths.serviceSwitcher.create.index
  }
  return response(req, res, 'services/select-org-type', context)
}

// --- PRIVATE

function validateServiceName (serviceName, serviceNameCy) {
  const errors = {}
  const nameValidationResult = validateMandatoryField(serviceName, SERVICE_NAME_MAX_LENGTH, 'service name')
  if (!nameValidationResult.valid) {
    errors['service_name'] = nameValidationResult.message
  }
  const welshNameValidationResult = validateOptionalField(serviceNameCy, SERVICE_NAME_MAX_LENGTH, 'welsh service name')
  if (!welshNameValidationResult.valid) {
    errors['service_name_cy'] = welshNameValidationResult.message
  }
  return errors
}

module.exports = {
  post,
  get
}
