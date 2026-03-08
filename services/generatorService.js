const puppeteer = require('puppeteer');
const path = require('path');

let page;

async function getGeneratorResults() {
	await page.click('#arcaneButton');
	const result = await page.$eval('#arcaneOutput', el => el.innerText);
	return result;
}

async function createGeneratorPageWithResults() {
	const browser = await puppeteer.launch();
	page = await browser.newPage();
	console.log('Generator page created');
	await page.goto('file://' + path.resolve('arcanesystems.html'));
	await page.waitForSelector('#arcaneOutput');
	const result = await page.$eval('#arcaneOutput', el => el.innerText);
	return result;
}

module.exports = { getGeneratorResults, createGeneratorPageWithResults };