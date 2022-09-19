// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './MultichainERC20.sol';

contract PumaPay is MultichainERC20 {
	constructor(
		string memory _name,
		string memory _symbol,
		uint8 _decimals,
		address _underlying,
		address _vault
	) MultichainERC20(_name, _symbol, _decimals, _underlying, _vault) {}
}
