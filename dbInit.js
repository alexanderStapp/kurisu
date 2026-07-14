const characterSource = require('./sources/charactersSource');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
});

require('./models/User')(sequelize, Sequelize.DataTypes);
require('./models/ShinyAttempt')(sequelize, Sequelize.DataTypes);
require('./models/CommandCooldown')(sequelize, Sequelize.DataTypes);
const Characters = require('./models/Character')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const characters = await Characters.bulkCreate(characterSource);

	await Promise.all(characters);
	console.log('characters synced');

	sequelize.close();
}).catch(console.error);