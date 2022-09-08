const { spawn } = require('child_process');

const verifyContracts = (networkId) => {
	const addresses = require(`../configurations/${networkId}/Addresses.json`);
	const networkNames = {
		56: 'bsc_main',
		97: 'bsc_test',
		3: 'ropsten',
		4: 'rinkeby',
		137: 'matic',
		80001: 'mumbai'
	};

	for (let contract of Object.keys(addresses[networkId])) {
		console.log('contract: ', contract);
		const ls = spawn('truffle', [
			'run',
			'verify',
			'--network',
			`${networkNames[Number(networkId)]}`,
			`${contract}@${addresses[networkId][contract]}`
		]);

		ls.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
		});

		ls.stderr.on('data', (data) => {
			console.log(`stderr: ${data}`);
		});

		ls.on('error', (error) => {
			console.log(`error: ${error.message}`);
		});

		ls.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
		});
	}
};

module.exports = { verifyContracts };
