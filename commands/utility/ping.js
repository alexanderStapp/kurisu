const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Ping Kurisu'),
	async execute(interaction) {
		const sent = await interaction.reply(`Websocket heartbeat: ${interaction.client.ws.ping}ms.`);
		interaction.followUp(`Roundtrip latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
	}
};