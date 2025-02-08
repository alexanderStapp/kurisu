const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		client.user.setActivity('activity test');
		console.log(`Ready. Logged in as self: ${client.user.tag}`);
	}
};