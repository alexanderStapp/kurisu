const { Events, ActivityType } = require('discord.js');
const getGeneratorResult = require('../services/getGeneratorOutput');
const sendMessageAndCreateThread = require('../services/sendMessageAndCreateThread');
const cron = require('node-cron');
const Characters = require('../models/Characters');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {

		// angel voices activity
		client.user.setActivity(await getGeneratorResult('arcanesystems'), { type: ActivityType.Custom });

		// cron test
		cron.schedule('* * * * *', async () => {
			const channel = client.channels.cache.get('493276796222046208');
			try {
				await sendMessageAndCreateThread(
				  channel,
				  'This is a scheduled test.',
				  'cronjob discussion',
				  4320
				);
			  } catch (error) {
				console.error('There was an error creating the message thread.', error);
			  }

		}, {
			timezone: 'America/Los_Angeles'
		});

		console.log('syncing dbs...');
		Characters.sync();

		// ready
		console.log(`Ready. Logged in as self: ${client.user.tag}`);
	}
};