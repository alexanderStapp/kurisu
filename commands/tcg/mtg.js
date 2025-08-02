const { SlashCommandBuilder,
	ModalBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle,
	EmbedBuilder
} = require('discord.js');

const axios = require('axios').default;

// const mtg = require('mtgsdk');

// async function getCardByName(cardName) {
// 	const axiosConfig = {
// 		method: 'get',
// 		url: `/cards/named?fuzzy=${encodeURIComponent(cardName)}`,
// 		baseURL: 'https://api.scryfall.com',
// 		headers: {
// 			'User-Agent': 'Kurisu/1.0',
// 			'Accept': 'application/json'
// 		}
// 	};
// 	try {
// 		await axios.request(axiosConfig).then(response => {
// 			console.log('console log b4 return', response.data);
// 			return response.data;
// 		});
// 	} catch (error) {
// 		if (error) {
// 			console.log(error);
// 		}
// 	}
// }

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mtg')
		.setDescription('Search for a MTG Card'),
	async execute(interaction) {
		const queryModal = new ModalBuilder()
			.setCustomId(`mtgQueryModal-${interaction.user.id}`)
			.setTitle('MTG Card Search');

		const queryModalInput = new TextInputBuilder()
			.setCustomId('mtgQueryModalInput')
			.setLabel('Title')
			.setStyle(TextInputStyle.Short)
			.setMaxLength(1_000)
			.setRequired(true);

		const actionRow = new ActionRowBuilder().addComponents(queryModalInput);
		queryModal.addComponents(actionRow);

		await interaction.showModal(queryModal);

		// Wait for modal submission
		// eslint-disable-next-line no-shadow
		const filter = (interaction) => interaction.customId === `mtgQueryModal-${interaction.user.id}`;

		interaction
			.awaitModalSubmit({ filter, time: 30_000 })
			.then(async (modalInteraction) => {
				const querySubmission = modalInteraction.fields.getTextInputValue('mtgQueryModalInput');
				axios({
					method: 'get',
					url: `/cards/named?fuzzy=${encodeURIComponent(querySubmission)}`,
					baseURL: 'https://api.scryfall.com',
					headers: {
						'User-Agent': 'Kurisu/1.0',
						'Accept': 'application/json'
					}
				}).then(response => {
					const mtgEmbed = new EmbedBuilder()
						.setColor(0x0099ff)
						.setTitle(`${interaction.user.username} searched for \`${querySubmission}\``)
						.setDescription('and I found this:')
						.setURL(response.data.scryfall_uri)
						.setImage(response.data.image_uris.normal);

					modalInteraction.reply({ embeds: [mtgEmbed] });
				});

				// this is janky and needs to be revisited
				// mtgEmbed.fields = [];
			})
			.catch((err) => {
				console.log(`Error when getting modal interaction: ${err}`);
			});
	}
};