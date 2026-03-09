const { Events, ActivityType } = require('discord.js');
const { createGeneratorPageWithResults, getGeneratorResults } = require('../services/generatorService');
// const sendMessageAndCreateThread = require('../services/sendMessageAndCreateThread');
const cron = require('node-cron');

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
});

const Characters = require('../models/Characters')(sequelize, Sequelize.DataTypes);

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {

		// Clear all global commands. This takes ~1 hour to update
		// client.application.commands.set([]);

		const dbTest = await Characters.findOne({ where: { fighter_number: 1 } });
		// angel voices activity
		client.user.setActivity(await createGeneratorPageWithResults(), { type: ActivityType.Custom });

		// cron test
		cron.schedule('0 * * * *', async () => {
			try {
				client.user.setActivity(await getGeneratorResults(), { type: ActivityType.Custom });
			  } catch (error) {
				console.error('There was an error creating the message thread.', error);
			  }

		}, {
			timezone: 'America/Los_Angeles'
		});

		// ready
		console.log(`Ready. Logged in as self: ${client.user.tag}`,
			dbTest.name
		);
	}
};