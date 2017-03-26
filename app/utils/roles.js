let _ = require('lodash');

const roles = {
  'admin': {id: 2, name: 'admin', description: 'Administrator'},
  'view-and-refund': {id: 3, name: 'view-and-refund', description: 'View and refund'},
  'view-only': {id: 4, name: 'view-only', description: 'View only'}
};

module.exports = {

  roles: roles,

  getRole: roleId => {
    let found = undefined;
    _.toArray(roles).forEach(role => {
      if (role.id == roleId) {
        found = role;
      }
    });
    return found;
  }
};
