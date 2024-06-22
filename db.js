const Sequelize = require("sequelize");
const sequelize = new Sequelize("eq_calculator", "root", "Th1@g0123", {
  host: "localhost",
  dialect: "mysql",
  port: 3306,
});

module.exports = sequelize;
