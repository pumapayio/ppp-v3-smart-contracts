// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IKeeperRegistry.sol';
import './RegistryHelper.sol';
import './interfaces/IBEP20.sol';
import './interfaces/IUniswapV2Router02.sol';

contract TokenConverter is RegistryHelper {
	uint256 public MIN_BALANCE_MULTIPLIER;
	uint256 public TOP_UP_MULTIPLIER;

	IUniswapV2Router02 router;
	IKeeperRegistry keeperRegistry;

	event TopUpPerformed(uint256 upkeepId, uint256 topUpAmount, uint256 timeStamp);
	event EmergencyTokenWithdrawal(address token, uint256 tokenAmount, uint256 timeStamp);

	constructor(address _mainRegistry) RegistryHelper(_mainRegistry) {
		address routerAddress = registry.getUniswapRouter();
		address keeperRegistryAddress = registry.getKeeperRegistry();
		require(
			routerAddress != address(0) && keeperRegistryAddress != address(0),
			'TokenConverter: INVALID ROUTER OR KEEPER'
		);

		router = IUniswapV2Router02(routerAddress);
		keeperRegistry = IKeeperRegistry(keeperRegistryAddress);

		MIN_BALANCE_MULTIPLIER = 3;
		TOP_UP_MULTIPLIER = 4;
	}

	function isLowBalance(uint256 _upkeepId) public view returns (bool isLow) {
		(, , , uint96 currentUpkeepBalance, , , ) = keeperRegistry.getUpkeep(_upkeepId);

		// Check if balance is above the threshold
		if (
			currentUpkeepBalance <=
			keeperRegistry.getMinBalanceForUpkeep(_upkeepId) * MIN_BALANCE_MULTIPLIER
		) {
			isLow = true;
		}
	}

	function topupUpkeep(uint256 _upkeepId) public returns (bool topupPerform) {
		if (isLowBalance(_upkeepId)) {
			address token = registry.getPMAToken();
			uint256 pmaBalance = IBEP20(token).balanceOf(address(this));
			address LinkToken = keeperRegistry.LINK();
			address[] memory path = new address[](2);
			path[0] = token;
			path[1] = LinkToken;
			uint256 topUpAmount = (pmaBalance * TOP_UP_MULTIPLIER) / 100;

			if (topUpAmount > 0) {
				IBEP20(token).approve(address(router), topUpAmount);

				uint256[] memory amounts = router.swapExactTokensForTokens(
					topUpAmount,
					1,
					path,
					address(this),
					block.timestamp + 1 days
				);

				topupPerform = true;

				// approve Link tokens to Keeper Registry
				require(IBEP20(LinkToken).approve(address(keeperRegistry), amounts[1]));

				// add funds to upkeep
				keeperRegistry.addFunds(_upkeepId, uint96(amounts[1]));

				emit TopUpPerformed(_upkeepId, amounts[1], block.timestamp);
			}
		}
	}

	/**
	 * @notice This method allows owner to withdraw the dust tokens.
	 * @param _token - ERC20/IBEP20 token address
	 * @param _amount - amount of tokens to withdraw
	 */
	function emergencyTokenWithdraw(IBEP20 _token, uint256 _amount) external onlyOwner {
		require(_token.balanceOf(address(this)) >= _amount, 'TokenConverter: Low_BALANCE');
		require(_token.transfer(msg.sender, _amount), 'TokenConverter: TRANSFER_FAILED');
	}

	/**
	 * @notice This method allows owner to update the balance multiplier for upkeep.
	 * @param _newMultiplier - new multiplier for upkeep balance
	 */
	function updateBalanceMultiplier(uint256 _newMultiplier) external onlyOwner {
		require(_newMultiplier > 0, 'TokenConverter: INVALID_MULTIPLIER');
		MIN_BALANCE_MULTIPLIER = _newMultiplier;
	}

	/**
	 * @notice This method allows owner to update the top up multiplier which affects the pma fund allocation for particular upkeep.
	 * @param _newMultiplier - new multiplier
	 */
	function updateTopUpMultiplier(uint256 _newMultiplier) external onlyOwner {
		require(_newMultiplier > 0, 'TokenConverter: INVALID_MULTIPLIER');
		TOP_UP_MULTIPLIER = _newMultiplier;
	}
}
