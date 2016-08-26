var userModel               = require('./user.js').sequelize;
var forgottenPasswordModel  = require('./forgotten_password.js').sequelize;
var sequelizeConfig         = require('../utils/sequelize_config.js');
var sequelizeConnection     = sequelizeConfig.sequelize;
