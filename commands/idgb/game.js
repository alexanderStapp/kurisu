// REFACTOR!! compare with Kurisu\commands\tcg\mtg.js


const { SlashCommandBuilder,
	ModalBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle
} = require('discord.js');

const { IDGB_CLIENT_ID, IDGB_ACCESS_TOKEN } = require('../../config.json');
const axios = require('axios').default;

const axiosConfig = {
	method: 'post',
	maxBodyLength: Infinity,
	url: 'https://api.igdb.com/v4/games',
	headers: {
	  'Client-ID': IDGB_CLIENT_ID,
	  'Content-Type': 'text/plain',
	  'Authorization': `Bearer ${IDGB_ACCESS_TOKEN}`
	},
	data: ''
};

const gameModel = {
	name: '',
	value: ''
};

const exampleEmbed = {
	color: 0x0099ff,
	title: 'You searched for',
	description: 'Some description here',
	fields: []
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
		// eslint-disable-next-line no-shadow
		const filter = (interaction) => interaction.customId === `gameQueryModal-${interaction.user.id}`;

		interaction
			.awaitModalSubmit({ filter, time: 30_000 })
			.then(async (modalInteraction) => {
				const querySubmission = modalInteraction.fields.getTextInputValue('gameQueryModalInput');
				axiosConfig.data = `fields name; where name ~ "${querySubmission}"*; sort rating desc; limit 5;`;
				axios.request(axiosConfig).then(response => {
					exampleEmbed.title = `You searched for \`${querySubmission}\``;
					exampleEmbed.description = 'and I found this:';
					for (let i = 0; i < response.data.length; i++) {
						exampleEmbed.fields.push(Object.create(gameModel));
						exampleEmbed.fields[i].name = response.data[i].name;
						exampleEmbed.fields[i].value = `id: ${response.data[i].id}`;
					};
					modalInteraction.reply({ embeds: [exampleEmbed] });

					// this is janky and needs to be revisited
					exampleEmbed.fields = [];
				});
			})
			.catch((err) => {
				console.log(`Error when getting modal interaction: ${err}`);
			});
	}
};