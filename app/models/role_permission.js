var sequelizeConfig = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize = require('sequelize');

var RolePermission = sequelizeConnection.define('role_permission', {
    role_id: Sequelize.INTEGER,
    permission_id: Sequelize.INTEGER
  },
  {
    tableName: 'role_permission',
    indexes: [
      {
        name: 'rolePermissionIndex',
        unique: true,
        fields: ['role_id', 'permission_id']
      }
    ]
  });

module.exports = {
  sequelize: RolePermission,
};
