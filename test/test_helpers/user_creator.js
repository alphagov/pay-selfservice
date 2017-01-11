var User = require(__dirname + '/../../app/models/user.js').User;
var userService = require(__dirname + '/../../app/services/user_service.js');

var Permission = require(__dirname + '/../../app/models/permission.js');
var Role = require(__dirname + '/../../app/models/role.js');
var UserRole = require(__dirname + '/../../app/models/user_role.js');
var RolePermission = require(__dirname + '/../../app/models/role_permission.js');

function sync_db() {
  return Permission.sequelize.sync({force: true})
    .then(() => Role.sequelize.sync({force: true}))
    .then(() => RolePermission.sequelize.sync({force: true}))
    .then(() => User.sync({force: true}))
    .then(() => UserRole.sequelize.sync({force: true}))
}

function createUserWithPermission(user, permissionName, cb) {
  var roleDef;
  var permissionDef;
  return sync_db()
    .then(()=> Permission.sequelize.create({name: permissionName, description: 'Permission Desc'}))
    .then((permission)=> permissionDef = permission)
    .then(()=> Role.sequelize.create({name: 'Role', description: "Role Desc"}))
    .then((role)=> roleDef = role)
    .then(()=> roleDef.setPermissions([permissionDef]))
    .then(()=> userService.create(user, roleDef))
    .then(()=> cb());
}

function createUser(user, cb) {
  createUserWithPermission(user, 'meaningless-permission-needed-by-Sequelize', cb);
}

module.exports = {
  createUserWithPermission: createUserWithPermission,
  createUser: createUser
};
