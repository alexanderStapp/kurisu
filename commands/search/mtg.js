const { SlashCommandBuilder,
	MessageFlags,
	EmbedBuilder
} = require('discord.js');

const axios = require('axios').default;

function colorCheck(colorsArray) {
	const colorOptionsArray = ['White', 'Blue', 'NotQuiteBlack', 'Red', 'DarkGreen'];
	if (colorsArray === undefined || colorsArray.length == 0) {
		return 'DarkGrey';
	} else if (colorsArray.length == 5) {
		return colorOptionsArray[Math.floor(Math.random() * 5)];
	} else if (colorsArray.find((color) => color.toLowerCase() == 'w')) {
		return 'White';
	} else if (colorsArray.find((color) => color.toLowerCase() == 'u')) {
		return 'Blue';
	} else if (colorsArray.find((color) => color.toLowerCase() == 'b')) {
		return 'NotQuiteBlack';
	} else if (colorsArray.find((color) => color.toLowerCase() == 'r')) {
		return 'Red';
	} else if (colorsArray.find((color) => color.toLowerCase() == 'g')) {
		return 'DarkGreen';
	}
}

module.exports = {
	cooldown: 5,
	category: 'search',
	data: new SlashCommandBuilder()
		.setName('mtg')
		.setDescription('Search for a MTG Card')
		.addStringOption(option =>
			option.setName('card-name')
				.setDescription('The card name to search for.')
				.setRequired(true)),
	async execute(interaction) {
		const cardName = interaction.options.getString('card-name', true).toLowerCase();
		axios({
			method: 'get',
			url: `/cards/named?fuzzy=${encodeURIComponent(cardName)}`,
			baseURL: 'https://api.scryfall.com',
			headers: {
				'User-Agent': 'Kurisu/1.0',
				'Accept': 'application/json'
			}
		}).then(response => {
			const mtgEmbed = new EmbedBuilder()
				.setColor(colorCheck(response.data.colors))
				.setTitle(response.data.name)
				.setURL(response.data.scryfall_uri)
				.setDescription(`${interaction.user.username} searched for \`${cardName}\``)
				.setImage(response.data.image_uris.normal);

			interaction.reply({ embeds: [mtgEmbed] });
		}).catch(error => {
			if (error.response) {
				return interaction.reply({ content: `Scryfall returned with this: \`${error.response.data.details}\``, flags: MessageFlags.Ephemeral });
			} else {
				interaction.reply({ content: 'There was an error. Sending error details to console...', flags: MessageFlags.Ephemeral });
				return console.log(error);
			}
		});
	}
};