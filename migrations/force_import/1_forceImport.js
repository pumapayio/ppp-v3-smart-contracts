const { forceImport } = require('@openzeppelin/truffle-upgrades');

const Registry = artifacts.require('Registry');
const PullPaymentsRegistry = artifacts.require('PullPaymentsRegistry');
const SinglePullPayment = artifacts.require('SinglePullPayment');
const Executor = artifacts.require('Executor');
const SingleDynamicPullPayment = artifacts.require('SingleDynamicPullPayment');
const RecurringPullPayment = artifacts.require('RecurringPullPayment');
const RecurringPullPaymentWithFreeTrial = artifacts.require('RecurringPullPaymentWithFreeTrial');
const RecurringPullPaymentWithPaidTrial = artifacts.require('RecurringPullPaymentWithPaidTrial');
const RecurringDynamicPullPayment = artifacts.require('RecurringDynamicPullPayment');

module.exports = async () => {
	try {
		const contractAddresses = {
			Registry: '0x5358A28A3fdFD3e43DF0Ec0dE2Cdaf6c1365E572',
			PullPaymentsRegistry: '0xb66FDF8e16C78a20c4742867EBA5d6e08a37F451',
			SinglePullPayment: '0xcD8Fd4dDee80f3f27845e74faa12fF6720975B4c',
			Executor: '0x286d4B4306ef74e68c7F2BAd529648812503593e',
			SingleDynamicPullPayment: '0xaffa2db1641273485365D526a2a9218E06803afc',
			RecurringPullPayment: '0x1f6f3e75D26bC77811A47Eac8d91aF8F2530bBba',
			RecurringPullPaymentWithFreeTrial: '0xaafE33394Dc1d7A3e117399FE9F959Bc8FCf5588',
			RecurringPullPaymentWithPaidTrial: '0x2e9b5d0B090c067177A52a78763BcA371f49f71f',
			RecurringDynamicPullPayment: '0xb0eBD14E3555b65941eD603923875465f6Daa6Ab'
		};

		const contracts = [
			Registry,
			PullPaymentsRegistry,
			SinglePullPayment,
			Executor,
			SingleDynamicPullPayment,
			RecurringPullPayment,
			RecurringPullPaymentWithFreeTrial,
			RecurringPullPaymentWithPaidTrial,
			RecurringDynamicPullPayment
		];

		for (let contractInstance of contracts) {
			console.log(
				'force import of ',
				contractInstance.contractName,
				contractAddresses[contractInstance.contractName]
			);
			await forceImport(contractAddresses[contractInstance.contractName], contractInstance, {
				kind: 'transparent'
			});
		}
	} catch (error) {
		console.log('error: ', error);
	}
};
