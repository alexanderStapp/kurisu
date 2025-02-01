const { SlashCommandBuilder, MessageFlags, italic } = require('discord.js');
// const wait = require('node:timers/promises').setTimeout;
const { JSDOM } = require('jsdom');

const legalChannel = 'angel-voices';

const generatorWindows = {};
const lastGeneratorUseTimes = {};
const generatorCacheTimes = {};
const maxNumberOfGeneratorsCached = 100;
const lastEditTimeCache = {};

// makeGeneratorWindow and getGeneratorResult were copied over from the perchance discord bot.
// They work for now but need to be reviewed for overhead/unused functionality. Remove these comments once that has been done.

async function makeGeneratorWindow(generatorName) {
	const response = await fetch(`https://perchance.org/api/downloadGenerator?generatorName=${generatorName}&__cacheBust=${Math.random()}`);
	if (!response.ok) throw new Error(`Error: A generator called '${generatorName}' doesn't exist`);
	const html = await response.text();

	const { window } = new JSDOM(html, { runScripts: 'dangerously' });
	let i = 0;
	while (!window.root && i++ < 30) await new Promise(r => setTimeout(r, 1000)); // try pausing for up to 30 seconds
	if (!window.root) {
		window.close();
		throw new Error(`Error: Couldn't initialize '${generatorName}' - took too long.`);
	}

	return window;
}

async function getGeneratorResult(generatorName, listNameOrCode, variableAssignments = []) {

	// NOTE: if listNameOrCode starts with "~>", then it's interpretted as code

	if (generatorWindows[generatorName] && (!lastEditTimeCache[generatorName] || Date.now() - lastEditTimeCache[generatorName] > 3000)) {
	// clear cache for this generator if it's stale:
		const result = await fetch('https://perchance.org/api/getGeneratorStats?name=' + generatorName).then(r => r.json());
		lastEditTimeCache[generatorName] = result.data.lastEditTime;
		if (generatorCacheTimes[generatorName] < result.data.lastEditTime) {
	  generatorWindows[generatorName].close();
	  delete generatorWindows[generatorName];
		}
	}

	// load and cache generator if we don't have it cached, and trim least-recently-used generator if the cache is too big
	if (!generatorWindows[generatorName]) {
		generatorWindows[generatorName] = await makeGeneratorWindow(generatorName);
		generatorCacheTimes[generatorName] = Date.now();
		lastGeneratorUseTimes[generatorName] = Date.now(); // <-- need this here so this generator doesn't get trimmed by the code below
		if (Object.keys(generatorWindows).length > maxNumberOfGeneratorsCached) {
			const mostStaleGeneratorName = Object.entries(lastGeneratorUseTimes).sort((a, b) => a[1] - b[1])[0];
			generatorWindows[generatorName].close();
			delete generatorWindows[generatorName];
			delete lastGeneratorUseTimes[generatorName];
		}
	}
	lastGeneratorUseTimes[generatorName] = Date.now();

	const win = generatorWindows[generatorName];
	const root = win.root;

	for (const [name, value] of variableAssignments) {
		console.log('variableAssignment:', name, value);
		// `name` can be something like "city.stats.population" or "inputEl.value"
		let w = win;
		let r = root;
		const parts = name.split('.');
		const lastPart = parts.pop();
		for (const n of parts) {
	  if (w) w = w[n];
	  if (r) r = r[n];
		}
		if (w) w[lastPart] = value;
		if (r) r[lastPart] = value;
	}

	if (listNameOrCode && listNameOrCode.startsWith('~>')) {
		let out;
		try {
	  const code = listNameOrCode.slice(2);

	  if (!win.__evaluateText) return 'Error: There\'s a bug. Please tell @hazysoda about this.'; // <-- probably indicates that I've changed the engine code.
	  out = win.__evaluateText(root, root, code); // TEMPORARY HACK! __evaluateText is private engine code and could be changed in the future, and this would break. `win.String(code).evaluateItem` doesn't work for some reason (maybe can't modify built-ins with JSDOM??)

		} catch (e) {
	  console.log(e);
	  out = e.message;
		}
		return out === '' ? ' ' : out;
	} else {
		if (!listNameOrCode) {
	  if (root.botOutput) listNameOrCode = 'botOutput';
	  else if (root.$output) listNameOrCode = '$output';
	  else if (root.output) listNameOrCode = 'output';
	  else return `Error: No 'botOutput' or or '$output' or 'output' list in the '${generatorName}' generator?`;
		}
		let result;
		try {
	  let r = root;
	  const parts = listNameOrCode.split('.');
	  const lastPart = parts.pop();
	  for (const n of parts) {
				if (r) r = r[n];
	  }
	  result = r[lastPart] + '';
		} catch (e) {
	  return 'Error: ' + e.message;
		}
		return result;
	}

}

module.exports = {
	cooldown: 24,
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