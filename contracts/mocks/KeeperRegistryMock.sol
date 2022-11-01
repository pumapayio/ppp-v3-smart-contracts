// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract KeeperRegistryMock {
	mapping(uint256 => uint96) public upkeepBalances;
	address public LINK;

	constructor(address link) {
		LINK = link;
	}

	function addFunds(uint256 upkeepId, uint96 amount) external {
		upkeepBalances[upkeepId] = amount;
	}

	function getMinBalanceForUpkeep(uint256 id) external view returns (uint96 minBalance) {
		minBalance = 1;
	}

	function getUpkeep(uint256 id)
		external
		view
		returns (
			address target,
			uint32 executeGas,
			bytes memory checkData,
			uint96 balance,
			address lastKeeper,
			address admin,
			uint64 maxValidBlocknumber
		)
	{
		balance = upkeepBalances[id];
	}
}
