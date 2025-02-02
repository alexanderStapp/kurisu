const { SlashCommandBuilder,
	MessageFlags,
	ModalBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle
} = require('discord.js');
// const { idgbClientId, idgbAccessToken } = require('./config.json');
// const apicalypse = require('apicalypse');

// const requestOptions = {
// 	queryMethod: 'url',
// 	method: 'post',
// 	baseURL: 'https://api.igdb.com/v4/',
// 	headers: {
// 		'Client-ID': idgbClientId,
// 		'Authorization': `Bearer ${idgbAccessToken}`
// 	},
// 	responseType: 'json',
// 	timeout: 1000
// };

const queryModal = new ModalBuilder()
	.setCustomId('gameQueryModal')
	.setTitle('Video Game Search');

const queryModalInput = new TextInputBuilder()
	.setCustomId('gameQueryModalInput')
	.setLabel('Input video game title')
	.setStyle(TextInputStyle.Short)
	.setMaxLength(1_000)
	.setRequired(true);

const actionRow = new ActionRowBuilder().addComponents(queryModalInput);
queryModal.addComponents(actionRow);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('game')
		.setDescription('Search for a videogame'),
	async execute(interaction) {
		await interaction.showModal(queryModal);
		// const response = await apicalypse(requestOptions)
		// 	.query('games')
		// 	.fields('*')
		// 	.search();
		const result = interaction.fields.getTextInputValue('gameQueryModalInput');
		console.log(result);
		// await interaction.reply({ content: 'I am done.', flags: MessageFlags.Ephemeral });
	}
};