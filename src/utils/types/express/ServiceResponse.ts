import express from 'express'

export default interface ServiceResponse extends express.Response {
  locals: express.Response['locals'] & {
    flash?: {
      messages?: { type: string; message: string }[]
    }
  }
}
