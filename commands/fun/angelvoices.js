const { SlashCommandBuilder, PermissionFlagsBits, italic } = require('discord.js');
const getGeneratorResults = require('../../services/generatorService').getGeneratorResults;

module.exports = {
	cooldown: 43_200,
	cooldownBypassPermission: PermissionFlagsBits.Administrator,
	category: 'fun',
	data: new SlashCommandBuilder()
		.setName('angelvoices')
		.setDescription('ARCANE SYSTEMS'),
	async execute(interaction) {
		await interaction.deferReply();
		const result = await getGeneratorResults();
		await interaction.editReply(italic(result));
	}
};
