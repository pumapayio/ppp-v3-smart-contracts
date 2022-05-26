module.exports = {
	skipFiles: ['Migrations.sol', 'mocks', 'common/libraries'],
	compileCommand: 'npm run compile',
	client: require('ganache'),
	providerOptions: {
		default_balance_ether: 100000,
		allowUnlimitedContractSize: true,
		chain: 1111,
		networkId: 1111
	},
	mocha: {
		color: false,
		noColors: true
	},
	norpc: true,
	testCommand: 'npx truffle test'
};
