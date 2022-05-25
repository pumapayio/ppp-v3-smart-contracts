// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';

import './interfaces/IVersionedContract.sol';
import './interfaces/IExecutor.sol';
import './interfaces/IBEP20.sol';
import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IUniswapV2Factory.sol';
import './interfaces/IUniswapV2Pair.sol';

import './interfaces/IPullPaymentRegistry.sol';

import '../pullPayments/interfaces/IPullPayment.sol';
import './RegistryHelper.sol';

/**
 * @title Executor
 * @author The Pumapay Team
 * @notice This contract executes the pullpayment for customer.
 *	This retrieves the payment tokens from user and transfers them to merchant.
 * @dev swap protocol is used to convert the user`s payment token to settlement token.
 * Execution fee is charged from the customer`s payment token and remaining tokens are sent to the merchant.
 * A typical example of execution is payment of 10PMA to merchant.
 * In this, if 10% is execution fee then execution fee receiver gets 1PMA and merchant receives 9PMA.
 */
contract Executor is ReentrancyGuardUpgradeable, RegistryHelper, IExecutor, IVersionedContract {
	/*
   	=======================================================================
   	======================== Constants ====================================
   	=======================================================================
 	*/
	uint256 constant deadline = 10 days;
	uint256 constant MAX_INT = type(uint256).max;

	/*
   	=======================================================================
   	======================== Public Variables ============================
   	=======================================================================
 	*/
	/// @dev PullPayment registry contract
	IPullPaymentRegistry public pullPaymentRegistry;
	/// @dev PMA token contract
	IBEP20 public PMAToken;
	/// @dev swap protocol router (Pancakeswap router)
	IUniswapV2Router02 public uniswapRouterV2;
	/// @dev swap protocol factory (Pancakeswap factory)
	IUniswapV2Factory public uniswapFactory;

	/*
   	=======================================================================
   	======================== Constructor/Initializer ======================
   	=======================================================================
 	*/
	/**
	 * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
	 * @dev This method initializes registry helper to be able to access method of core registry.
	 * Also initializes the uniswpa factory, router, ppRegistry and pma token contracts
	 */
	function initialize(address registryAddress) external virtual initializer {
		__ReentrancyGuard_init();
		_init_registryHelper(registryAddress);

		pullPaymentRegistry = IPullPaymentRegistry(registry.getPullPaymentRegistry());
		PMAToken = IBEP20(registry.getPMAToken());
		uniswapRouterV2 = IUniswapV2Router02(registry.getUniswapRouter());
		uniswapFactory = IUniswapV2Factory(registry.getUniswapFactory());
	}

	/*
   	=======================================================================
   	======================== Modifiers ====================================
 		=======================================================================
 	*/

	/// @notice This modifier checks only granted executors are calling the execute method
	modifier onlyGrantedExecutors(address _executor) {
		require(
			pullPaymentRegistry.isExecutorGranted(_executor) == true,
			'Executor: PERMISSION_DENIED'
		);
		_;
	}

	/*
   	=======================================================================
   	======================== Public Methods ===============================
   	=======================================================================
 	*/

	/**
	 *  @notice This function executes the pullpayment of given billing model for given subscription id
	 *  @dev This function calls the executePullpayment method of pullpayment contract
	 *  @param _bmType indicates the pullPayment contracts name.
	 *  @param _subscriptionId indicates the subscription id of customer
	 *	@return pullPaymentID - id of executed pullpayment
	 */
	function execute(string calldata _bmType, uint256 _subscriptionId)
		external
		virtual
		override
		returns (uint256 pullPaymentID)
	{
		bytes32 identifierHash = keccak256(abi.encodePacked(_bmType));
		address pullPaymentAddress = pullPaymentRegistry.getPPAddressForOrDie(identifierHash);

		//get the pullPayment contract interface
		IPullPayment pullPayment = IPullPayment(pullPaymentAddress);

		//Execute the pullPayment for given subscriptionId for given BillingModel type
		//Current Flow for pullPayment execution
		//backend-> Executor(public execute()) -> RecurringPullPayment(executePullPayment()) -> Executor(internal execute())
		return pullPayment.executePullPayment(_subscriptionId);
	}

	/**
	 *	@notice This function Swaps the payment tokens to settlement tokens if needed and transafer the tokens to merchent.
	 * 	For all the cases below we have the following convention-
	 * 	<payment token> ---> <settlement token>
	 * 	======================================================
	 * 	Case 1: token0 ---> token0 payment, then simple transfer for same tokens - No need to SWAP
	 *  ======================================================
	 *	Case 2: no-PMA --> PMA
	 * 	In this case, we need to convert the payment token to PMA
	 * 	======================================================
	 * 	Case 3: PMA to no-PMA
	 * 	In this case, we need to convert PMA to the settlement token
	 * 	In the cases below there should always be a route through the PMA token in the chain of SWAPS
	 *  ======================================================
	 *	Case 4: no-PMA to no-PMA
	 *  In this the first SWAP path is:: WBNB ---> PMA ---> USDT
	 *	seconds swap path is direct :: WBNB --> USDT
	 *
	 *	@dev This execute function can only be called by granted executor. Grant executor in pullPayment registry to allow calling this method
	 *	@param settlementToken			- indicates IBEP20 token address which is accepted by merchent
	 *	@param paymentToken 				- indicates IBEP20 token address which customer wants to pay
	 *	@param from 								- indicates address of the customer
	 *	@param to 									- indicates address of merchent
	 *	@param amount 							- indicates amount of payment tokens
	 */
	function execute(
		address settlementToken,
		address paymentToken,
		address from,
		address to,
		uint256 amount
	) external virtual override onlyGrantedExecutors(msg.sender) returns (bool) {
		IBEP20 _paymentToken = IBEP20(paymentToken);
		require(registry.isSupportedToken(paymentToken), 'Executor: PAYMENT_TOKEN_NOT_SUPPORTED');

		// For all the cases below we have the following convention
		// <payment token> ---> <settlement token>
		// ========================================
		// Case 1: token0 ---> token0 payment, then simple transfer for same tokens - No need to SWAP
		if (paymentToken == settlementToken) {
			uint256 executionFee = _transferExecutionFee(from, _paymentToken, amount);
			uint256 finalAmount = amount - executionFee;

			require(_paymentToken.transfer(to, finalAmount), 'Executor: TRANSFER_FAILED');

			return true;
			// need to go through SWAP protocol to cover the following cases:
		} else {
			// Case 2: no-PMA --> PMA
			// In this case, we need to convert the payment token to PMA
			// ======================
			// Case 3: PMA to no-PMA
			// In this case, we need to convert PMA to the settlement token
			// In the cases below there should always be a route through the PMA token in the chain of SWAPS
			// Case 4: no-PMA to no-PMA same the SWAP path is:: WBNB ---> PMA ---> WBNB

			(bool canSwap, address[] memory path) = canSwapFromV2(paymentToken, settlementToken);

			require(canSwap, 'Executor: NO_SWAP_PATH_EXISTS');

			uint256[] memory amountInMax = uniswapRouterV2.getAmountsIn(amount, path);

			// transfer execution fee
			uint256 executionFee = _transferExecutionFee(from, _paymentToken, amountInMax[0]);
			uint256 finalAmount = amountInMax[0] - executionFee;

			// Then we need to approve the payment token to be used by the Router
			_paymentToken.approve(address(uniswapRouterV2), finalAmount);

			uniswapRouterV2.swapExactTokensForTokens(
				finalAmount, // amount in
				1, // minimum out
				path, // swap path
				to, // token receiver
				block.timestamp + deadline
			);

			return true;
		}
	}

	/**
	 * @notice This method returns merchant` receiving amount, user`s payable amount and execution fee charges when given payment token and settlement tokens
	 * @dev
	 *	``` Execution fee = user payable amount * execution fee / 10000 ```
	 *	``` Receiving Amount = user payable amount - execution fee ```
	 * @param _paymentToken 			- indicates the payment token address
	 * @param _settlementToken 		- indicates the settlement token address
	 * @param _amount 						- indicates the amount of tokens to swap
	 * @return receivingAmount 		- indicates merchant` receiving amount after cutting the execution fees
	 * userPayableAmount 					- indicates customer` payble amount
	 * executionFee 							- indicates amount of execution fee charged from payment token
	 */
	function getReceivingAmount(
		address _paymentToken,
		address _settlementToken,
		uint256 _amount
	)
		public
		view
		virtual
		returns (
			uint256 receivingAmount,
			uint256 userPayableAmount,
			uint256 executionFee
		)
	{
		if (_paymentToken == _settlementToken) {
			// Case 1: token0 --> token0
			// In this case, we need directly transfers the tokens
			executionFee = (_amount * registry.executionFee()) / 10000;

			userPayableAmount = _amount;
			receivingAmount = _amount - executionFee;
		} else {
			// Case 2: no-PMA --> PMA
			// In this case, we need to convert the payment token to PMA
			// ======================
			// Case 3: PMA to no-PMA
			// In this case, we need to convert PMA to the settlement token
			// In the cases below there should always be a route through the PMA token in the chain of SWAPS
			// Case 4: no-PMA to no-PMA same the SWAP path is:: WBNB ---> PMA ---> WBNB
			(bool canSwap, address[] memory path) = canSwapFromV2(_paymentToken, _settlementToken);

			require(canSwap, 'Executor: NO_SWAP_PATH_EXISTS');

			uint256[] memory amountInMax = uniswapRouterV2.getAmountsIn(_amount, path);

			// amount of tokens to get from user;
			userPayableAmount = amountInMax[0];

			// execution fee
			executionFee = (amountInMax[0] * registry.executionFee()) / 10000;
			uint256 finalAmount = amountInMax[0] - executionFee;

			uint256[] memory amountsOut = uniswapRouterV2.getAmountsOut(finalAmount, path);

			// amount of tokens merchent will get
			if (path.length == 2) receivingAmount = amountsOut[1];
			if (path.length == 3) receivingAmount = amountsOut[2];
		}
	}

	/**
	 * @notice This method checks whether from token can be converted to toToken or not. returns true and swap path is there otherwise returns false.
	 * @param _fromToken 	- indicates the Payment Token
	 * @param _toToken	  - indicates settlement token
	 * @return canSWap 		- indicates whether thers is path for swap or not. 	 
	 					 path 			- indicates swap path
	 */
	function canSwapFromV2(address _fromToken, address _toToken)
		public
		view
		virtual
		returns (bool canSWap, address[] memory path)
	{
		if (_fromToken != _toToken) {
			if (
				(_fromToken != address(PMAToken) && _toToken == address(PMAToken)) ||
				(_fromToken == address(PMAToken) && _toToken != address(PMAToken))
			) {
				// check direct path for PMA
				if (_haveReserve(IUniswapV2Pair(uniswapFactory.getPair(_fromToken, _toToken)))) {
					canSWap = true;

					path = new address[](2);
					path[0] = _fromToken;
					path[1] = _toToken;

					return (canSWap, path);
				}
			}

			// check path through the PMA
			IUniswapV2Pair pair1 = IUniswapV2Pair(uniswapFactory.getPair(_fromToken, address(PMAToken)));
			IUniswapV2Pair pair2 = IUniswapV2Pair(uniswapFactory.getPair(_toToken, address(PMAToken)));
			if (_haveReserve(pair1) && _haveReserve(pair2)) {
				canSWap = true;

				path = new address[](3);
				path[0] = _fromToken;
				path[1] = address(PMAToken);
				path[2] = _toToken;

				return (canSWap, path);
			}

			// check direct path
			address directPair = uniswapFactory.getPair(_fromToken, _toToken);
			if (_haveReserve(IUniswapV2Pair(directPair))) {
				canSWap = true;

				path = new address[](2);
				path[0] = _fromToken;
				path[1] = _toToken;

				return (canSWap, path);
			}

			// check path through WBNB
			address wbnb = registry.getWBNBToken();
			pair1 = IUniswapV2Pair(uniswapFactory.getPair(_fromToken, wbnb));
			pair2 = IUniswapV2Pair(uniswapFactory.getPair(_toToken, wbnb));
			if (_haveReserve(pair1) && _haveReserve(pair2)) {
				canSWap = true;

				path = new address[](3);
				path[0] = _fromToken;
				path[1] = address(wbnb);
				path[2] = _toToken;

				return (canSWap, path);
			}
		}
	}

	/*
   	=======================================================================
   	======================== Internal Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @notice This method calculates the execution fee and transfers it to the executionFee receiver
	 * @param _from 					- user address
	 * @param _paymentToken 	- payment token address
	 * @param _amount					- amount of payment tokens
	 */
	function _transferExecutionFee(
		address _from,
		IBEP20 _paymentToken,
		uint256 _amount
	) internal virtual returns (uint256 executionFee) {
		// get tokens from the user
		require(_paymentToken.transferFrom(_from, address(this), _amount));

		// calculate exection fee
		executionFee = (_amount * registry.executionFee()) / 10000;

		// transfer execution Fee to executionFee receiver
		if (executionFee > 0) {
			require(
				_paymentToken.transfer(registry.executionFeeReceiver(), executionFee),
				'Executor: TRANSFER_FAILED'
			);
		}
	}

	/**
	 * @notice checks if the UNI v2 contract have reserves to swap tokens
	 * @param pair 	- pair contract address ex. PMA-WBNB Pair
	 */
	function _haveReserve(IUniswapV2Pair pair) internal view returns (bool hasReserve) {
		if (address(pair) != address(0)) {
			(uint256 res0, uint256 res1, ) = pair.getReserves();
			if (res0 > 0 && res1 > 0) {
				return true;
			}
		}
	}

	/*
   	=======================================================================
   	======================== Getter Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @notice Returns the storage, major, minor, and patch version of the contract.
	 * @return The storage, major, minor, and patch version of the contract.
	 */
	function getVersionNumber()
		external
		pure
		virtual
		override
		returns (
			uint256,
			uint256,
			uint256,
			uint256
		)
	{
		return (1, 0, 0, 0);
	}
}
