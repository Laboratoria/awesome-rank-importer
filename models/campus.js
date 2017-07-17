'use strict';
module.exports = function(sequelize, DataTypes) {
  var Campus = sequelize.define('Campus', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Campus;
};