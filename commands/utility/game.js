const { SlashCommandBuilder,
	ModalBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle
} = require('discord.js');

const { idgbClientId, idgbAccessToken } = require('../../config.json');
const axios = require('axios').default;

const axiosConfig = {
	method: 'post',
	maxBodyLength: Infinity,
	url: 'https://api.igdb.com/v4/search',
	headers: {
	  'Client-ID': idgbClientId,
	  'Content-Type': 'text/plain',
	  'Authorization': `Bearer ${idgbAccessToken}`
	},
	data: ''
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('game')
		.setDescription('Search for a videogame'),
	async execute(interaction) {
		const queryModal = new ModalBuilder()
			.setCustomId(`gameQueryModal-${interaction.user.id}`)
			.setTitle('Video Game Search');

		const queryModalInput = new TextInputBuilder()
			.setCustomId('gameQueryModalInput')
			.setLabel('Title')
			.setStyle(TextInputStyle.Short)
			.setMaxLength(1_000)
			.setRequired(true);

		const actionRow = new ActionRowBuilder().addComponents(queryModalInput);
		queryModal.addComponents(actionRow);

		await interaction.showModal(queryModal);

		// Wait for modal submission

		const filter = (interaction) => interaction.customId === `gameQueryModal-${interaction.user.id}`;

		interaction
			.awaitModalSubmit({ filter, time: 30_000 })
			.then(async (modalInteraction) => {
				const querySubmission = modalInteraction.fields.getTextInputValue('gameQueryModalInput');
				axiosConfig.data = `fields *; search "${querySubmission}"; limit 3;`;
				axios.request(axiosConfig).then(response => {
					modalInteraction.reply(JSON.stringify(response.data));
					console.log(JSON.stringify(response.data));
				});
			})
			.catch((err) => {
				console.log(`Error when getting modal interaction: ${err}`);
			});
	}
};