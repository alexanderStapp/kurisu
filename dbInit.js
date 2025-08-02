const characterSource = require('./sources/charactersSource');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
});

const Characters = require('./models/Characters')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const characters = await Characters.bulkCreate(characterSource);

	await Promise.all(characters);
	console.log('characters synced');

	sequelize.close();
}).catch(console.error);