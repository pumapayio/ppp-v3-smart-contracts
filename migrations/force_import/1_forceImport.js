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
			Registry: '0xb74FE07AbB552d9c05ebE08A8bC956aEf51D6B03',
			PullPaymentsRegistry: '0x9B14FDbA0031D314A67c1bd27232a755F321dF2F',
			SinglePullPayment: '0xCc6b2D6f14f6cC6D7009B96A6cf3855dAd44c7f0',
			Executor: '0xc9fdd1778b659E051290E40bdBbd88709FD56900',
			SingleDynamicPullPayment: '0xa1a6bB74C5e82625166983620d0d68986Bf7e739',
			RecurringPullPayment: '0x47F3A91207a2bf119D9699a4E5b4D7F6C1BA5E05',
			RecurringPullPaymentWithFreeTrial: '0xEdB12AD30dEc412F3ce7859DFFDd82a107fFa6E5',
			RecurringPullPaymentWithPaidTrial: '0xB75A3b4A4DA2F2043Ed5Fc6d92669821C4d2f846',
			RecurringDynamicPullPayment: '0x5ACD271e836DAbc7fC67dAF28bC2c5757ebE5521'
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
