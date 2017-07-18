let chai = require('chai');
let roles = require('../../../app/utils/roles');
let expect = chai.expect;

describe('roles module', function () {

  it('should find get role by role id', function (done) {
    let role = roles.getRoleByExtId(200);

    expect(role).to.deep.equal({extId: 200, name: 'admin', description: 'Administrator'});
    done();
  });

  it('should return undefined for unknown role id', function (done) {
    let role = roles.getRoleByExtId('999');

    expect(role).to.equal(undefined);
    done();
  });
});
