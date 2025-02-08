const { Events, ActivityType } = require('discord.js');
const getGeneratorResult = require('../services/getGeneratorOutput');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		client.user.setActivity(await getGeneratorResult('arcanesystems'), { type: ActivityType.Custom });
		console.log(`Ready. Logged in as self: ${client.user.tag}`);
	}
};