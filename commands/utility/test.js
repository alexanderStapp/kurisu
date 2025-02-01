const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('this is a test')
		.setDefaultMemberPermissions(0),
	async execute(interaction) {
		await interaction.reply('the test worked!');
	}
};