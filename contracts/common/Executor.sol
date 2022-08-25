// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './RegistryHelper.sol';

import './interfaces/IVersionedContract.sol';
import './interfaces/IExecutor.sol';
import './interfaces/IBEP20.sol';
import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IUniswapV2Factory.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IPullPaymentRegistry.sol';
import './interfaces/ITokenConverter.sol';
import '../pullPayments/interfaces/IPullPayment.sol';

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
contract Executor is ReentrancyGuard, RegistryHelper, IExecutor, IVersionedContract {
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
	 * @dev This method initializes registry helper to be able to access method of core registry.
	 * Also initializes the uniswpa factory, router, ppRegistry and pma token contracts
	 */
	constructor(address registryAddress) RegistryHelper(registryAddress) {
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

	function execute(
		address settlementToken,
		address paymentToken,
		address from,
		address to,
		uint256 amount
	)
		external
		virtual
		override
		onlyGrantedExecutors(msg.sender)
		returns (
			uint256 executionFee,
			uint256 userAmount,
			uint256 receiverAmount
		)
	{
		IBEP20 _paymentToken = IBEP20(paymentToken);
		require(registry.isSupportedToken(paymentToken), 'Executor: PAYMENT_TOKEN_NOT_SUPPORTED');

		// For all the cases below we have the following convention
		// <payment token> ---> <settlement token>
		// ========================================
		// Case 1: PMA ---> PMA payment,
		// 1. Get PMA tokens from user
		// 1. Transfer execution fee in PMA
		// 2. Then simple transfer same tokens to merchant - No need to SWAP
		if (paymentToken == settlementToken && paymentToken == address(PMAToken)) {
			// get tokens from the user
			require(_paymentToken.transferFrom(from, address(this), amount));
			userAmount = amount;
			executionFee = _transferExecutionFee(_paymentToken, amount);
			receiverAmount = amount - executionFee;

			require(_paymentToken.transfer(to, receiverAmount), 'Executor: TRANSFER_FAILED');
		} else {
			(executionFee, userAmount, receiverAmount) = _execute(
				settlementToken,
				IBEP20(paymentToken),
				from,
				to,
				amount
			);
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
		uint256 executionFeePercent = registry.executionFee();

		if (_paymentToken == _settlementToken && _paymentToken == address(PMAToken)) {
			// Case 1: token0 --> token0
			// In this case, we need directly transfers the tokens
			executionFee = (_amount * executionFeePercent) / 10000;

			userPayableAmount = _amount;
			receivingAmount = _amount - executionFee;
		} else {
			(
				bool canSwap,
				bool isTwoPaths,
				address[] memory path1,
				address[] memory path2
			) = canSwapFromV2(_paymentToken, _settlementToken);

			require(canSwap, 'Executor: NO_SWAP_PATH_EXISTS');

			// This flow is executed when neither of the token is PMA token
			if (isTwoPaths) {
				// get required PMA tokens for non-pma tokens
				uint256[] memory path2Amount = uniswapRouterV2.getAmountsIn(_amount, path2);
				// get required non-PMA tokens for PMA tokens
				uint256[] memory path1Amount = uniswapRouterV2.getAmountsIn(path2Amount[0], path1);

				userPayableAmount = path1Amount[0];
				executionFee = (path1Amount[path1Amount.length - 1] * executionFeePercent) / 10000;

				uint256[] memory amountsOut = uniswapRouterV2.getAmountsOut(
					path1Amount[path1Amount.length - 1] - executionFee,
					path2
				);

				receivingAmount = amountsOut[amountsOut.length - 1];
			} else {
				uint256[] memory amountInMax = uniswapRouterV2.getAmountsIn(_amount, path1);

				userPayableAmount = amountInMax[0];

				// transfer execution fee
				if (_paymentToken == address(PMAToken)) {
					// get execution fees in PMA
					executionFee = (amountInMax[0] * executionFeePercent) / 10000;
					uint256 finalAmount = amountInMax[0] - executionFee;

					uint256[] memory amountsOut = uniswapRouterV2.getAmountsOut(finalAmount, path1);
					receivingAmount = amountsOut[amountsOut.length - 1];
				} else if (_settlementToken == address(PMAToken)) {
					uint256[] memory amountsOut = uniswapRouterV2.getAmountsOut(amountInMax[0], path1);
					executionFee = (amountsOut[amountsOut.length - 1] * executionFeePercent) / 10000;

					receivingAmount = amountsOut[amountsOut.length - 1] - executionFee;
				}
			}
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
		returns (
			bool canSWap,
			bool isTwoPaths,
			address[] memory path1,
			address[] memory path2
		)
	{
		address pma = address(PMAToken);

		if (_fromToken == pma && _toToken == pma) {
			canSWap = true;
			return (canSWap, isTwoPaths, path1, path2);
		}

		address wbnb = registry.getWBNBToken();

		// CASE: PMA -> non-PMA || non-PMA -> PMA
		if (_fromToken == pma || _toToken == pma) {
			// check direct path for PMA
			if (_haveReserve(IUniswapV2Pair(uniswapFactory.getPair(_fromToken, _toToken)))) {
				canSWap = true;

				path1 = new address[](2);
				path1[0] = _fromToken;
				path1[1] = _toToken;
			} else {
				IUniswapV2Pair pair1 = IUniswapV2Pair(uniswapFactory.getPair(_fromToken, wbnb));
				IUniswapV2Pair pair2 = IUniswapV2Pair(uniswapFactory.getPair(wbnb, _toToken));

				if (_haveReserve(pair1) && _haveReserve(pair2)) {
					canSWap = true;

					path1 = new address[](3);
					path1[0] = _fromToken;
					path1[1] = wbnb;
					path1[2] = _toToken;
				}
			}
		} else {
			// CASE: non-PMA token0 -> non-PMA token1
			// 1. convert non-PMA token0 to PMA
			// 2. convert PMA to non-PMA token1

			// check path through the PMA
			IUniswapV2Pair pair1 = IUniswapV2Pair(uniswapFactory.getPair(_fromToken, pma));
			IUniswapV2Pair pair2 = IUniswapV2Pair(uniswapFactory.getPair(pma, _toToken));

			if (_haveReserve(pair1) && _haveReserve(pair2)) {
				canSWap = true;
				isTwoPaths = true;

				path1 = new address[](2);
				path1[0] = _fromToken;
				path1[1] = pma;

				path2 = new address[](2);
				path2[0] = pma;
				path2[1] = _toToken;
			} else if (!_haveReserve(pair1) && _haveReserve(pair2)) {
				// check path through the WBNB i.e token0 -> WBNB -> PMA
				IUniswapV2Pair pair3 = IUniswapV2Pair(uniswapFactory.getPair(_fromToken, wbnb));
				IUniswapV2Pair pair4 = IUniswapV2Pair(uniswapFactory.getPair(wbnb, pma));

				if (_haveReserve(pair3) && _haveReserve(pair4)) {
					canSWap = true;
					isTwoPaths = true;

					path1 = new address[](3);
					path1[0] = _fromToken;
					path1[1] = wbnb;
					path1[2] = pma;

					path2 = new address[](2);
					path2[0] = pma;
					path2[1] = _toToken;
				}
			} else if (_haveReserve(pair1) && !_haveReserve(pair2)) {
				// check path through the WBNB i.e PMA -> WBNB -> token1
				IUniswapV2Pair pair3 = IUniswapV2Pair(uniswapFactory.getPair(pma, wbnb));
				IUniswapV2Pair pair4 = IUniswapV2Pair(uniswapFactory.getPair(wbnb, _toToken));

				if (_haveReserve(pair3) && _haveReserve(pair4)) {
					canSWap = true;
					isTwoPaths = true;

					path1 = new address[](2);
					path1[0] = _fromToken;
					path1[1] = pma;

					path2 = new address[](3);
					path2[0] = pma;
					path2[1] = wbnb;
					path2[2] = _toToken;
				}
			}
		}
		return (canSWap, isTwoPaths, path1, path2);
	}

	/*
   	=======================================================================
   	======================== Internal Methods ===============================
   	=======================================================================
 	*/

	function _execute(
		address settlementToken,
		IBEP20 paymentToken,
		address from,
		address to,
		uint256 amount
	)
		internal
		returns (
			uint256 executionFee,
			uint256 userAmount,
			uint256 receiverAmount
		)
	{
		(bool canSwap, bool isTwoPaths, address[] memory path1, address[] memory path2) = canSwapFromV2(
			address(paymentToken),
			settlementToken
		);

		require(canSwap, 'Executor: NO_SWAP_PATH_EXISTS');

		uint256[] memory amounts;
		uint256 finalAmount;

		// This flow is executed when neither of the token is PMA token
		if (isTwoPaths) {
			// Case 2: non-PMA token0 ---> non-PMA token1 payment,
			// 1. Get two paths for token conversion i.e non-PMA token0 ---> PMA && PMA ---> non-PMA token1
			// 2. Get required amount of tokens from user
			// 3. Swap token0 tokens to PMA tokens
			// 4. Transfer execution fee in PMA
			// 5. Swap remaining PMA to token1

			amounts = uniswapRouterV2.getAmountsIn(amount, path2);
			amounts = uniswapRouterV2.getAmountsIn(amounts[0], path1);

			userAmount = amounts[0];

			require(paymentToken.transferFrom(from, address(this), userAmount));

			// Then we need to approve the payment token to be used by the Router
			paymentToken.approve(address(uniswapRouterV2), userAmount);

			amounts = uniswapRouterV2.swapExactTokensForTokens(
				userAmount, // amount in
				1, // minimum out
				path1, // swap path i.e non-PMA -> PMA|| mpm-PMA -> WBNB -> PMA
				address(this), // token receiver
				block.timestamp + deadline
			);

			// get execution fees in PMA
			executionFee = _transferExecutionFee(IBEP20(address(PMAToken)), amounts[amounts.length - 1]);

			finalAmount = amounts[amounts.length - 1] - executionFee;

			// Then we need to approve the PMA token to be used by the Router
			PMAToken.approve(address(uniswapRouterV2), finalAmount);

			amounts = uniswapRouterV2.swapExactTokensForTokens(
				finalAmount, // amount in
				1, // minimum out
				path2, // swap path i.e non-PMA -> PMA|| mpm-PMA -> WBNB -> PMA
				to, // token receiver
				block.timestamp + deadline
			);

			receiverAmount = amounts[amounts.length - 1];
		} else {
			// CASE 3: PMA -> non-PMA or non-PMA -> PMA
			// 1. Get required amount of tokens from user
			// 2. There are two cases
			//  	a. payment token is PMA token
			//			i. Transfer execution fee in PMA
			//		 ii. Swap remaining PMA tokens to non-PMA tokens and transfer to merchant
			//		b. settlement token is PMA token
			//			i. Swap non-PMA tokens to PMA tokens
			//		 ii. Transfer execution fee in PMA
			//		iii. Transfer remaining PMA tokens to merchant

			amounts = uniswapRouterV2.getAmountsIn(amount, path1);
			userAmount = amounts[0];

			require(paymentToken.transferFrom(from, address(this), userAmount));

			// transfer execution fee
			if (address(paymentToken) == address(PMAToken)) {
				// get execution fees in PMA
				executionFee = _transferExecutionFee(paymentToken, userAmount);
				finalAmount = userAmount - executionFee;

				// Then we need to approve the payment token to be used by the Router
				paymentToken.approve(address(uniswapRouterV2), finalAmount);

				amounts = uniswapRouterV2.swapExactTokensForTokens(
					finalAmount, // amount in
					1, // minimum out
					path1, // swap path i.e PMA->non-PMA || PMA -> WBNB -> non-PMA
					to, // token receiver
					block.timestamp + deadline
				);

				receiverAmount = amounts[amounts.length - 1];
			} else if (settlementToken == address(PMAToken)) {
				// Then we need to approve the payment token to be used by the Router
				paymentToken.approve(address(uniswapRouterV2), userAmount);

				amounts = uniswapRouterV2.swapExactTokensForTokens(
					userAmount, // amount in
					1, // minimum out
					path1, // swap path i.e non-PMA -> PMA || non-PMA -> WBNB -> PMA
					address(this), // token receiver
					block.timestamp + deadline
				);

				// get execution fees in PMA
				executionFee = _transferExecutionFee(IBEP20(settlementToken), amounts[amounts.length - 1]);
				receiverAmount = amounts[amounts.length - 1] - executionFee;

				require(PMAToken.transfer(to, receiverAmount), 'Executor: TRANSFER_FAILED');
			}
		}
	}

	/**
	 * @notice This method calculates the execution fee and transfers it to the executionFee receiver
	 * @param _paymentToken 	- payment token address
	 * @param _amount					- amount of payment tokens
	 */
	function _transferExecutionFee(IBEP20 _paymentToken, uint256 _amount)
		internal
		virtual
		returns (uint256 executionFee)
	{
		require(address(_paymentToken) == address(PMAToken), 'Executor: INVALID_FEE_TOKEN');
		// calculate exection fee
		executionFee = (_amount * registry.executionFee()) / 10000;

		// transfer execution Fee in PMA to executionFee receiver
		if (executionFee > 0) {
			require(
				_paymentToken.transfer(registry.executionFeeReceiver(), executionFee),
				'Executor: TRANSFER_FAILED'
			);
		}

		uint256 upKeepId = pullPaymentRegistry.upkeepIds(msg.sender);

		require(upKeepId > 0, 'EXECUTOR:INVALID_UPKEEP_ID');

		ITokenConverter(registry.getTokenConverter()).topupUpkeep(upKeepId);
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
