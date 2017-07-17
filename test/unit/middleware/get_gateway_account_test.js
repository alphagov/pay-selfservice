'use strict'
// Core Dependencies
const path = require('path');
// NPM Dependencies
const proxyquire = require('proxyquire');
const lodash = require('lodash');
const sinon = require('sinon')
const {expect} = require('chai');

// Local Dependencies
const paths = require('../../../app/paths');


const connectorMock =  {ConnectorClient: function() {this.getAccount = connectorGetAccountMock}};
const authServiceMock = {getCurrentGatewayAccountId: () => currentGatewayAccountID}
let req, res, next, currentGatewayAccountID, getGatewayAccount, connectorGetAccountMock ;



describe('middleware: getGatewayAccount', () => {
  beforeEach(() => {
    req = {
      correlationId:'sdfghjk'
    }
    res = {
      redirect: sinon.spy()
    }
    next = sinon.spy()
    connectorGetAccountMock = sinon.spy((params) => {return Promise.resolve({id: params.gatewayAccountId})})
    getGatewayAccount = proxyquire(path.join(__dirname,'../../../app/middleware/get_gateway_account'), {
      '../services/auth_service.js': authServiceMock,
      '../services/clients/connector_client.js': connectorMock
    })
  })


  it('should call connectorClient.getAccount if it can resolve a currentGatewayAccountId', done => {
    currentGatewayAccountID = 1
    lodash.set(req,'user.serviceRoles[0]',{gatewayAccountIds:['1','2','3']})
    getGatewayAccount(req,res,next).then(() => {
      expect(connectorGetAccountMock.called).to.equal(true)
      expect(connectorGetAccountMock.calledWith({gatewayAccountId:1, correlationId:'sdfghjk'})).to.equal(true)
      expect(next.called).to.equal(true)
      expect(res.redirect.called).to.equal(false)
      done()
    })
  })


})