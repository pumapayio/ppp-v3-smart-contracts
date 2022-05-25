const { spawn } = require('child_process');

const verifyContracts = (networkId) => {
	const addresses = require(`../configurations/${networkId}/Addresses.json`);

	for (let contract of Object.keys(addresses[networkId])) {
		console.log('contract: ', contract);
		const ls = spawn('truffle', [
			'run',
			'verify',
			'--network',
			'bsc_test',
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
