// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './MintBurnWrapper.sol';

contract PumaPayWrapper is MintBurnWrapper {
	constructor(
		address _token,
		TokenType _tokenType,
		uint256 _totalMintCap,
		address _admin
	) MintBurnWrapper(_token, _tokenType, _totalMintCap, _admin) {}
}
