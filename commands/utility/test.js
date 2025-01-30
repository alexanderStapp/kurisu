const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('this is a test'),
	async execute(interaction) {
		await interaction.reply('testing!');
	}
};