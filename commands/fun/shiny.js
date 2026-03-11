const { SlashCommandBuilder,
	ModalBuilder,
	StringSelectMenuBuilder,
	LabelBuilder,
	TextInputBuilder,
	TextInputStyle,
	StringSelectMenuOptionBuilder
} = require('discord.js');

const { getVersionGroups } = require('../../services/PokeAPIService');

const VERSION_GROUP_BLACKLIST = ['the-isle-of-armor', 'the-crown-tundra', 'the-teal-mask', 'the-indigo-disk', 'red-green-japan', 'blue-japan', 'mega-dimension'];

const versionGroupsSelectLabel = new LabelBuilder();

let defaultVersion = '';
let defaultAttempts = '';
let defaultTimeSpent = '';
let defaultPokemon = '';

module.exports = {
	category: 'fun',
	data: new SlashCommandBuilder()
		.setName('shiny')
		.setDescription('Build a shiny attempts tracker'),
	async execute(interaction) {
		const shinyModal = new ModalBuilder()
			.setCustomId(`shinyModal-${interaction.user.id}`)
			.setTitle('Shiny Attempts Tracker');
		const dbTest = await Characters.findOne({ where: { fighter_number: 1 } });
		getVersionGroups().then(async (versionGroups) => {
			const filteredVersionGroups = versionGroups.results.filter(versionGroup => !VERSION_GROUP_BLACKLIST.includes(versionGroup.name));
			const mappedVersionGroups = filteredVersionGroups.map(versionGroup => new StringSelectMenuOptionBuilder()
				.setLabel(versionGroup.name)
				.setDescription(`Hunting in ${versionGroup.name}`)
				.setValue(versionGroup.name));

			const VersionGroupsSelect = new StringSelectMenuBuilder()
				.setCustomId('versionGroupsSelect')
				.setPlaceholder(defaultVersion || 'Select the game you are hunting in')
				.setRequired(true)
				.addOptions(mappedVersionGroups);
			versionGroupsSelectLabel.setLabel('Select version').setStringSelectMenuComponent(VersionGroupsSelect);

		}).finally(async () => {
			const attemptsInput = new TextInputBuilder()
				.setCustomId('attemptsInput')
				.setStyle(TextInputStyle.Short)
				.setValue(defaultAttempts)
				.setRequired(true);
			const attemptsLabel = new LabelBuilder()
				.setLabel('How many attempts have you made?')
				.setDescription('Enter the number of attempts')
				.setTextInputComponent(attemptsInput);

			const timeSpentInput = new TextInputBuilder()
				.setCustomId('timeSpentInput')
				.setStyle(TextInputStyle.Short)
				.setValue(defaultTimeSpent)
				.setRequired(true);
			const timeSpentLabel = new LabelBuilder()
				.setLabel('How much time have you spent?')
				.setDescription('Enter the time spent in minutes')
				.setTextInputComponent(timeSpentInput);

			const pokemonSearchInput = new TextInputBuilder()
				.setCustomId('pokemonSearchInput')
				.setStyle(TextInputStyle.Short)
				.setValue(defaultPokemon)
				.setRequired(true);
			const pokemonSearchLabel = new LabelBuilder()
				.setLabel('What Pokémon are you hunting?')
				.setDescription('Search using the name of the Pokémon you are hunting')
				.setTextInputComponent(pokemonSearchInput);

			shinyModal.addLabelComponents(versionGroupsSelectLabel, attemptsLabel, timeSpentLabel, pokemonSearchLabel);
			await interaction.showModal(shinyModal);
		});
	}
};