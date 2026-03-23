import _ from 'lodash'
import logger from './logger'
import { Request, Response } from 'express'
import displayConverter from './display-converter'
const LOGGER = logger(__filename)

const ERROR_MESSAGE = 'There is a problem with the payments platform'
const ERROR_VIEW = 'error'

function response(req: Request, res: Response, template: string, data: object = {}) {
  const convertedData: object = Object.assign({}, displayConverter(req, data, template) as object)
  render(req, res, template, convertedData)
}

function errorResponse(
  req: Request,
  res: Response,
  msg: string = ERROR_MESSAGE,
  status = 500,
  additionalModel: object
) {
  if (typeof msg !== 'string') {
    msg = 'Please try again or contact support team.'
  }
  const model = { message: msg, ...additionalModel }

  const errorMeta = {
    status,
    error_message: msg,
  }

  LOGGER.info('An error has occurred. Rendering error view', errorMeta)
  res.setHeader('Content-Type', 'text/html')

  res.status(status)
  response(req, res, ERROR_VIEW, model)
}

function render(req: Request, res: Response, template: string, data: object) {
  if (process.env.NODE_ENV !== 'production' && _.get(req, 'headers.accept') === 'application/json') {
    res.setHeader('Content-Type', 'application/json')

    res.json(data)
  } else {
    res.render(template, data)
  }
}

function healthCheckResponse(accept: unknown, res: Response, data: unknown) {
  res.setHeader('Content-Type', 'application/json')
  res.json(data)
}

export { response, healthCheckResponse, errorResponse as renderErrorView }
