var sequelizeConfig     = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize           = require('sequelize');
var Permission          = require('./permission.js').sequelize;
var RolePermission      = require('./role_permission.js').sequelize;

var Role = sequelizeConnection.define('roles', {
  description: {
    unique: true,
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
});

Role.belongsToMany(Permission, {as: 'permissions', through: RolePermission, foreignKey:'role_id', otherKey:'permission_id'});
Role.sequelize.sync();

module.exports = {
  sequelize: Role,
};
