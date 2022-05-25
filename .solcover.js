module.exports = {
	skipFiles: ['Migrations.sol', 'mocks'],
	compileCommand: 'npm run compile',
	client: require("ganache-cli"),
	providerOptions: {
		fork: 'http://localhost:8545',
		default_balance_ether: 100000,
		allowUnlimitedContractSize: true
	},
	mocha: {
		color: false,
		noColors: true
	},
	norpc: true,
	testCommand: 'npx truffle test'
};
