let roles = require('../../../app/utils/roles')

describe('roles module', () => {
  it('should find get role by role id', done => {
    let role = roles.getRoleByExtId(200)

    expect(role).toEqual({ extId: 200, name: 'admin', description: 'Administrator' })
    done()
  })

  it('should return undefined for unknown role id', done => {
    let role = roles.getRoleByExtId('999')

    expect(role).toBeUndefined()
    done()
  })
})
