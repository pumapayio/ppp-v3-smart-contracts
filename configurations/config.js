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
	1111: []
};

const PMATokenAddress = {
	1: '0x846c66cf71c43f80403b51fe3906b3599d63336f',
	3: '',
	4: '',
	42: '',
	56: '0x43a167B15a6F24913A8B4D35488B36Ac15d39200',
	97: '0xc5d495EEaA84942095b769342bC71125721692Da',
	1111: '0xc5d495EEaA84942095b769342bC71125721692Da'
};

const UniswapFactoryAddress = {
	1: '',
	3: '',
	4: '',
	42: '',
	56: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', // pancakeFactory
	97: '0xe885AaeE6e0d794578A254852e705302E4266117',
	1111: '0xe885AaeE6e0d794578A254852e705302E4266117'
};

const UniswapV2Router02Address = {
	1: '',
	3: '',
	4: '',
	42: '',
	56: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // pancake router
	97: '0xbfA5273765B9ac128974C15bd9812BD906b66840', // pancake router
	1111: '0xbfA5273765B9ac128974C15bd9812BD906b66840'
};

const WBNB_ADDRESS = {
	1: '',
	3: '',
	4: '',
	42: '',
	97: '0x6de3a3de82a7aedca279b36db65a5b03b1a9f939',
	56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
	1111: ''
};

const BUSD_ADDRESS = {
	1: '',
	3: '',
	4: '',
	42: '',
	97: '0x593fA2BBC1eED5fC44458AAd8b367868c970f72F',
	56: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
	1111: ''
};

const executors = {
	1: [],
	3: [],
	4: [],
	42: [],
	56: [], // TODO: Specify for mainnet
	97: ['0xEe77464640445ca2Fd674064B6887f7abb0B9c97'],
	1111: []
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
	]
};

const ExecutionFeeReceiver = '0xb2A80b679F87530EdFB848708CA948cbF25Ca3e0';
const ExecutionFee = 1000; // 10%

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
	faucets
};
