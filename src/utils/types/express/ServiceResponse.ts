import express from 'express'
import { Message } from './ServiceRequest'

export default interface ServiceResponse extends express.Response {
  locals: express.Response['locals'] & {
    flash?: {
      messages?: Message[]
    }
  }
}
