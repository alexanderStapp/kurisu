const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	dialect: 'sqlite',
	host: 'localhost',
	logging: false,
	storage: 'database.sqlite'
});

module.exports = sequelize;