const { SlashCommandBuilder, ActionRowBuilder } = require('discord.js');

const row = new ActionRowBuilder()
	.addComponents(component);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('this is a test'),
	async execute(interaction) {
		await interaction.reply({ components: [row] });
	}
};