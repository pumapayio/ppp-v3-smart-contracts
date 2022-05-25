const fs = require('fs');
const path = require('path');

const GAS_PRICE = 10; // 10 gwei
const addresssPath = path.join('test/helpers', 'GasInfo.json');

const gasToEth = (gascost) => {
	return (Number(gascost) * GAS_PRICE) / 10 ** 9;
};

const getGasCost = async (contractName, operationName, gasUsed) => {
	data = require('./GasInfo.json');

	const operation = {};
	operation[operationName.toString()] = '';

	if (data[contractName.toString()] === undefined) {
		data[contractName.toString()] = operation;
	}

	data[contractName.toString()][operationName.toString()] = gasToEth(gasUsed).toString();
	console.log('data: ', data);

	fs.writeFile(addresssPath, JSON.stringify(data), (err) => {
		if (err) throw err;
	});
};

module.exports = { getGasCost };
