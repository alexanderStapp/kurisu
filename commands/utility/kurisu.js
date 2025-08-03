const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('kurisu')
		.setDescription('Do you believe in me?'),
	async execute(interaction) {
		await interaction.reply('My name is Kurisu. I am a bot that lives in your computer.');
	}
};