const sinon = require('sinon')
const inviteUserController = require('./invite-user.controller')

describe('invite user controller', () => {
  it('should error for an invalid email address', async () => {
    const externalServiceId = 'some-external-service-id'
    const req = {
      user: { externalId: 'some-ext-id', serviceIds: ['1'] },
      body: {
        'invitee-email': 'invalid@examplecom',
        'role-input': '200'
      },
      service: {
        externalId: externalServiceId
      },
      flash: sinon.stub()
    }
    const res = {
      redirect: sinon.stub()
    }

    await inviteUserController.invite(req, res)
    sinon.assert.calledWith(req.flash, 'genericError', 'Enter a valid email address')
    sinon.assert.calledWith(res.redirect, 303, `/service/${externalServiceId}/team-members/invite`)
  })

  it('should error if a role is not recognised', async () => {
    const externalServiceId = 'some-external-service-id'
    const unknownRoleId = '999'
    const req = {
      user: { externalId: 'some-ext-id', serviceIds: ['1'] },
      body: {
        'invitee-email': 'valid@example.com',
        'role-input': unknownRoleId
      },
      service: {
        externalId: externalServiceId
      },
      flash: sinon.stub()
    }
    const res = {
      redirect: sinon.stub()
    }

    await inviteUserController.invite(req, res)
    sinon.assert.calledWith(req.flash, 'genericError', 'Select the team member’s permission level')
    sinon.assert.calledWith(res.redirect, 303, `/service/${externalServiceId}/team-members/invite`)
  })
})
