const axios = require('axios').default;

async function getVersionGroups() {
	try {
		const response = await axios.get('https://pokeapi.co/api/v2/version-group/?offset=0&limit=1000');
		return response.data;
	} catch (error) {
		console.error('Error fetching version groups:', error);
		throw error;
	}
}

module.exports = { getVersionGroups };