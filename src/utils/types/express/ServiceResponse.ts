import express from 'express'
import { Message } from './Message'

export default interface ServiceResponse extends express.Response {
  locals: express.Response['locals'] & {
    flash?: {
      messages?: Message[]
    }
  }
}
