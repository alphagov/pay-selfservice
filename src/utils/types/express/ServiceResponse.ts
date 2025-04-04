import type { Response } from 'express'

export default interface ServiceResponse extends Response {
  locals: Response['locals'] & {
    flash?: {
      messages?: { type: string; message: string }[]
    }
  }
}
