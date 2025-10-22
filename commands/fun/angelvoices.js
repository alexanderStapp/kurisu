const { SlashCommandBuilder, MessageFlags, italic } = require('discord.js');
// const wait = require('node:timers/promises').setTimeout;
const getGeneratorResult = require('../../services/getGeneratorOutput');

const legalChannel = 'angel-voices';


module.exports = {
	cooldown: 24,
	category: 'fun',
	data: new SlashCommandBuilder()
		.setName('angelvoices')
		.setDescription('ARCANE SYSTEMS'),
	async execute(interaction) {
		if (interaction.channel.name !== legalChannel) {
			return await interaction.reply({ content: `I am sorry. I am only allowed to complete your request in the ${legalChannel} channel.`, flags: MessageFlags.Ephemeral });
			// await wait(8_000);
			// await interaction.deleteReply();
		}
		await interaction.deferReply();
		const result = await getGeneratorResult('arcanesystems');
		await interaction.editReply(italic(result));
	}
};