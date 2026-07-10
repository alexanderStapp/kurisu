const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
});

const NowPlayingMonth = require('../models/NowPlayingMonth')(sequelize, Sequelize.DataTypes);
const GuildSetting = require('../models/GuildSetting')(sequelize, Sequelize.DataTypes);
const SubmittedSong = require('../models/SubmittedSong')(sequelize, Sequelize.DataTypes);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ROMAN_MAP = [
	[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
	[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
	[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
];

const TRACK_LINK_REGEX = /(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/|spotify:track:)([A-Za-z0-9]+)/g;

function roman(num) {
	let remaining = num;
	let result = '';
	for (const [value, symbol] of ROMAN_MAP) {
		while (remaining >= value) {
			result += symbol;
			remaining -= value;
		}
	}
	return result;
}

function parseTrackIds(text) {
	const ids = [];
	for (const match of text.matchAll(TRACK_LINK_REGEX)) {
		if (!ids.includes(match[1])) {
			ids.push(match[1]);
		}
	}
	return ids;
}

function formatMonth(year, month) {
	return `${MONTHS[month - 1]} ${year}`;
}

function currentYearMonth() {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/Los_Angeles',
		year: 'numeric',
		month: 'numeric'
	}).formatToParts(new Date());
	const year = Number(parts.find(part => part.type === 'year').value);
	const month = Number(parts.find(part => part.type === 'month').value);
	return { year, month };
}

async function findMonthForThread(threadId) {
	return NowPlayingMonth.findOne({ where: { forum_thread_id: threadId } });
}

async function getSongChannelId(guildId) {
	const setting = await GuildSetting.findByPk(guildId);
	return setting ? setting.song_channel_id : null;
}

async function createPendingSubmission(guildId, year, month, trackId, threadChannelId, threadMessageId) {
	try {
		return await SubmittedSong.create({
			guild_id: guildId,
			year,
			month,
			track_id: trackId,
			thread_channel_id: threadChannelId,
			thread_message_id: threadMessageId,
			status: 'pending'
		});
	} catch (error) {
		if (error instanceof Sequelize.UniqueConstraintError) {
			return null;
		}
		throw error;
	}
}

async function setAdminMessageId(submission, adminMessageId) {
	submission.admin_message_id = adminMessageId;
	await submission.save();
}

async function findSubmissionByAdminMessage(adminMessageId) {
	return SubmittedSong.findOne({ where: { admin_message_id: adminMessageId } });
}

async function resolveSubmission(submission, status) {
	submission.status = status;
	await submission.save();
}

async function ensureMonthForGuild(client, guildId, forumChannelId) {
	const { year, month } = currentYearMonth();

	const existing = await NowPlayingMonth.findOne({ where: { guild_id: guildId, year, month } });
	if (existing) {
		return existing;
	}

	const previous = await NowPlayingMonth.findOne({ where: { guild_id: guildId }, order: [['sequence', 'DESC']] });
	const sequence = (previous ? previous.sequence : 0) + 1;

	const forum = await client.channels.fetch(forumChannelId);
	const tag = forum.availableTags.find(available => available.name === 'Now Playing');
	const appliedTags = tag ? [tag.id] : [];

	const title = `Now Playing, ${formatMonth(year, month)}`;
	const intro = 'send me a song and i\'ll add it to this month\'s playlist';

	const thread = await forum.threads.create({
		name: title,
		message: { content: intro },
		appliedTags
	});

	const row = await NowPlayingMonth.create({
		guild_id: guildId,
		year,
		month,
		sequence,
		forum_thread_id: thread.id
	});

	try {
		await thread.pin();
	} catch (error) {
		console.error('Failed to pin Now Playing post:', error.message);
	}

	if (previous) {
		try {
			const previousThread = await client.channels.fetch(previous.forum_thread_id);
			await previousThread.unpin();
		} catch (error) {
			console.error('Failed to unpin previous Now Playing post:', error.message);
		}
	}

	const songChannelId = await getSongChannelId(guildId);
	if (songChannelId) {
		try {
			const songChannel = await client.channels.fetch(songChannelId);
			await songChannel.send(`create new playlist, title: now_playing_${roman(sequence)}`);
		} catch (error) {
			console.error('Failed to post new-playlist notice to song channel:', error.message);
		}
	}

	return row;
}

async function ensureAllMonths(client) {
	const settings = await GuildSetting.findAll();
	for (const setting of settings) {
		if (!setting.music_forum_channel_id) {
			continue;
		}
		try {
			await ensureMonthForGuild(client, setting.guild_id, setting.music_forum_channel_id);
		} catch (error) {
			console.error(`Failed to ensure Now Playing month for guild ${setting.guild_id}:`, error.message);
		}
	}
}

module.exports = {
	ensureAllMonths,
	ensureMonthForGuild,
	findMonthForThread,
	getSongChannelId,
	createPendingSubmission,
	setAdminMessageId,
	findSubmissionByAdminMessage,
	resolveSubmission,
	parseTrackIds,
	formatMonth,
	roman
};
