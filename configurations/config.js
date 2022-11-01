const supportedTokens = {
	1: [],
	3: [],
	4: [],
	42: [],
	56: [
		'0x43a167B15a6F24913A8B4D35488B36Ac15d39200' // PMA
	],
	97: [
		'0xc5d495EEaA84942095b769342bC71125721692Da', // PMA
		'0x593fA2BBC1eED5fC44458AAd8b367868c970f72F', // BUSD
		'0x9a881b8363995eef5f0fa6c430625dcb39d31224', // USDT
		'0xC171a6bB0E02052063D059f65F4ea234D3DD2c02' // BTCB
	],
	137: ['0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7', // busd
		'0xc2132D05D31c914a87C6611C10748AEb04B58e8F',  	// USDT
		'0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',	// DAI
	],
	1111: [],
	80001: [
		'0x00584Bb80c7473f0c5F68C1bF4A5b447660aa9E2', // USDT
		'0x5DdFDb797104d7a04EA7dD3f35E190499A968178',	// ADA
		'0x2D40d4aD83b9CCfc77Bc29772C4a3066e44677D2', // ETH
		'0xB160d10f6E909d4A3c5FCB52665d5A474d3E8325', // PMA
		'0x0b99f70C1489ACA8F75AD33147C709d944037023'	// WBNB
	]
};

const PMATokenAddress = {
	1: '0x846c66cf71c43f80403b51fe3906b3599d63336f',
	3: '',
	4: '',
	42: '',
	56: '0x43a167B15a6F24913A8B4D35488B36Ac15d39200',
	97: '0xc5d495EEaA84942095b769342bC71125721692Da',
	137: '',
	1111: '0xc5d495EEaA84942095b769342bC71125721692Da',
	80001: '0xB160d10f6E909d4A3c5FCB52665d5A474d3E8325' // USDT as PMA
};

const UniswapFactoryAddress = {
	1: '',
	3: '',
	4: '',
	42: '',
	56: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', // pancakeFactory
	97: '0xe885AaeE6e0d794578A254852e705302E4266117',
	137: '',
	1111: '0xe885AaeE6e0d794578A254852e705302E4266117',
	80001: '0x7efFF2318D6f023186d7F2218b8e95d875F49f37'
};

const UniswapV2Router02Address = {
	1: '',
	3: '',
	4: '',
	42: '',
	56: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // pancake router
	97: '0xbfA5273765B9ac128974C15bd9812BD906b66840', // pancake router
	137: '',
	1111: '0xbfA5273765B9ac128974C15bd9812BD906b66840',
	80001: '0x6d99a99A94507dA62c65e6d853E9e9a1000047a3'
};

const WBNB_ADDRESS = {
	1: '',
	3: '',
	4: '',
	42: '',
	97: '0x6de3a3de82a7aedca279b36db65a5b03b1a9f939',
	56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
	137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
	1111: '',
	80001: '0x0b99f70C1489ACA8F75AD33147C709d944037023'
};

const BUSD_ADDRESS = {
	1: '',
	3: '',
	4: '',
	42: '',
	97: '0x593fA2BBC1eED5fC44458AAd8b367868c970f72F',
	56: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
	137: '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7',
	1111: '',
	80001: '0x00584Bb80c7473f0c5F68C1bF4A5b447660aa9E2' // USDT as BUSD
};

const executors = {
	1: [],
	3: [],
	4: [],
	42: [],
	56: [], // TODO: Specify for mainnet
	97: ['0xEe77464640445ca2Fd674064B6887f7abb0B9c97'],
	137: ['0xaD679804243814D016eC2EB1972E745729051942'],
	1111: [],
	80001: ['0xaD679804243814D016eC2EB1972E745729051942']
};

const faucets = {
	1: [],
	3: [],
	4: [],
	42: [],
	56: [
		'0x43a167B15a6F24913A8B4D35488B36Ac15d39200' // PMA
	],
	97: [
		{
			TokenAddress: '0xc5d495EEaA84942095b769342bC71125721692Da', // PMA
			Amount: '10000000000000000000000' // 10k
		},
		{
			TokenAddress: '0x593fA2BBC1eED5fC44458AAd8b367868c970f72F', // BUSD
			Amount: '100000000000000000000' // 100
		},
		{
			TokenAddress: '0x9a881b8363995eef5f0fa6c430625dcb39d31224', // USDT
			Amount: '100000000000000000000' // 100
		},
		{
			TokenAddress: '0xC171a6bB0E02052063D059f65F4ea234D3DD2c02', // BTCB
			Amount: '100000000000000000' // 0.1
		}
	],

	137: [],
	1111: [
		{
			TokenAddress: '0xc5d495EEaA84942095b769342bC71125721692Da', // PMA
			Amount: '10000000000000000000000' // 10k
		},
		{
			TokenAddress: '0x593fA2BBC1eED5fC44458AAd8b367868c970f72F', // BUSD
			Amount: '100000000000000000000' // 100
		},
		{
			TokenAddress: '0x9a881b8363995eef5f0fa6c430625dcb39d31224', // USDT
			Amount: '100000000000000000000' // 100
		},
		{
			TokenAddress: '0xC171a6bB0E02052063D059f65F4ea234D3DD2c02', // BTCB
			Amount: '100000000000000000' // 0.1
		}
	],
	80001: [
		{
			TokenAddress: '0x5DdFDb797104d7a04EA7dD3f35E190499A968178', // ADA
			Amount: '100000000000000000' // 0.1
		},
		{
			TokenAddress: '0x2D40d4aD83b9CCfc77Bc29772C4a3066e44677D2', // ETH
			Amount: '100000000000000000' // 0.1
		},
		{
			TokenAddress: '0x00584Bb80c7473f0c5F68C1bF4A5b447660aa9E2', // PMA
			Amount: '100000000000000000' // 0.1
		},
		{
			TokenAddress: '0x0b99f70C1489ACA8F75AD33147C709d944037023', // WBNB
			Amount: '100000000000000000' // 0.1
		},
	]
};

const keeperRegistry = {
	1: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
	3: '',
	4: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
	42: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
	97: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
	56: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
	1111: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
	137: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
	80001: '0x02777053d6764996e594c3E88AF1D58D5363a2e6' // USDT as BUSD
};

const MPC_ADDRESS = {
	1: '',
	3: '',
	4: '',
	42: '',
	56: '',
	97: '',
	137: '',
	1111: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
	80001: ''
};


const ExecutionFeeReceiver = '0xb2A80b679F87530EdFB848708CA948cbF25Ca3e0'; // TODO - must be Token converter contract
const ExecutionFee = 1000; // 10%

const TotalMintCapForWrapper = '50000000000000000000000000'; // 50M
const PumaPayWrapperAdmin = '0xaD679804243814D016eC2EB1972E745729051942';

module.exports = {
	supportedTokens,
	PMATokenAddress,
	UniswapFactoryAddress,
	UniswapV2Router02Address,
	ExecutionFeeReceiver,
	ExecutionFee,
	executors,
	WBNB_ADDRESS,
	BUSD_ADDRESS,
	faucets,
	keeperRegistry,
	TotalMintCapForWrapper,
	PumaPayWrapperAdmin
};
