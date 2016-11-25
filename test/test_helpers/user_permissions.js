var User = require(__dirname + '/../../app/models/user.js');
var Permission = require(__dirname + '/../../app/models/permission.js');
var Role = require(__dirname + '/../../app/models/role.js');
var UserRole = require(__dirname + '/../../app/models/user_role.js');
var RolePermission = require(__dirname + '/../../app/models/role_permission.js');

function sync_db() {
  return Permission.sequelize.sync({force: true})
    .then(() => Role.sequelize.sync({force: true}))
    .then(() => RolePermission.sequelize.sync({force: true}))
    .then(() => User.sequelize.sync({force: true}))
    .then(() => UserRole.sequelize.sync({force: true}))
}

function create(user, permissionName, cb) {
  var roleDef;
  var permissionDef;
  sync_db()
    .then(()=> Permission.sequelize.create({name: permissionName, description: 'Permission Desc'}))
    .then((permission)=> permissionDef = permission)
    .then(()=> Role.sequelize.create({name: 'Role', description: "Role Desc"}))
    .then((role)=> roleDef = role)
    .then(()=> roleDef.setPermissions([permissionDef]))
    .then(()=> User.create(user, roleDef))
    .then(()=> cb());
}

module.exports = {
  create: create
};
