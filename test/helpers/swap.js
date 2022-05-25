const deadline = '0xf000000000000000000000000000000000000000000000000000000000000000';

async function createPair(factory, token0, token1) {
	const newPair = await factory.createPair(token0, token1);
	return newPair;
}

async function getPair(factory, token0, token1) {
	const initcodeHash = await factory.INIT_CODE_PAIR_HASH();
	console.log('initCodeHash: ', initcodeHash);

	return factory.getPair(token0, token1);
}

async function swap(router, sender, token0, token1, amount) {
	await token0.approve(router.address, amount, { from: sender });

	const tx = await router.swapExactTokensForTokens(
		amount,
		1,
		[token0.address, token1.address],
		sender,
		deadline,
		{ from: sender }
	);
	console.log('tx: ', tx);
	const tokensReceived = await token1.balanceOf(sender);
	console.log('tokensReceived: ', tokensReceived.toString());
}

async function addLiquidity(factory, router, sender, token0, token1, amount0, amount1) {
	// getPair
	await getPair(factory, token0.address, token1.address);

	// approve tokens to router
	await token0.approve(router.address, amount0, { from: sender });
	await token1.approve(router.address, amount1, { from: sender });

	// add liquidity
	await router.addLiquidity(
		token0.address,
		token1.address,
		amount0,
		amount1,
		1,
		1,
		sender,
		deadline,
		{
			from: sender
		}
	);
	// console.log("tx: ", tx);
}

module.exports = {
	addLiquidity,
	swap,
	getPair,
	createPair
};
