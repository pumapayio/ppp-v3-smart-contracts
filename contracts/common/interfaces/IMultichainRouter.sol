// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IRouter {
	function mint(address to, uint256 amount) external returns (bool);

	function burn(address from, uint256 amount) external returns (bool);

	function token() external view returns (address);

	function tokenType() external view returns (TokenType);
}

// TokenType token type enumerations (*required* by the multichain front-end)
// When in `need approve` situations, the user should approve to this wrapper contract,
// not to the Router contract, and not to the target token to be wrapped.
// If not, this wrapper will fail its function.
enum TokenType {
	MintBurnAny, // mint and burn(address from, uint256 amount), don't need approve
	MintBurnFrom, // mint and burnFrom(address from, uint256 amount), need approve
	MintBurnSelf, // mint and burn(uint256 amount), call transferFrom first, need approve
	Transfer, // transfer and transferFrom, need approve
	TransferDeposit, // transfer and transferFrom, deposit and withdraw, need approve, block when lack of liquidity
	TransferDeposit2 // transfer and transferFrom, deposit and withdraw, need approve, don't block when lack of liquidity
}
