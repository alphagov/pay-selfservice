import sinon from 'sinon'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import validateStatusFilter from './validate-status-filter'

describe('validate status filter middleware', () => {
  let req: Partial<ServiceRequest>
  let res: Partial<ServiceResponse>
  let next: sinon.SinonSpy

  beforeEach(() => {
    req = {} as Partial<ServiceRequest>
    res = {} as Partial<ServiceResponse>
    next = sinon.spy()
  })

  it('should call next() when status filter is TEST', () => {
    req.params = { statusFilter: 'test' }
    validateStatusFilter(req as ServiceRequest, res as ServiceResponse, next)
    sinon.assert.calledWithExactly(next)
  })

  it('should call next() when status filter is LIVE', () => {
    req.params = { statusFilter: 'live' }
    validateStatusFilter(req as ServiceRequest, res as ServiceResponse, next)
    sinon.assert.calledWithExactly(next)
  })

  it('should call next(route) when status filter is NOT live/test', () => {
    req.params = { statusFilter: 'invalid-status' }
    validateStatusFilter(req as ServiceRequest, res as ServiceResponse, next)
    sinon.assert.calledWith(next, 'route')
  })
})
