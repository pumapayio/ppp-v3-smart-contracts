// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PullPaymentUtils - library for managing address arrays
 * @author The Pumapay Team
 */
library PullPaymentUtils {
	/**
	 * @notice This method allows admin to except the addresses to have multiple tokens of same NFT.
	 * @param _list 		- storage reference to address list
	 * @param _address 	- indicates the address to add.
	 */
	function addAddressInList(address[] storage _list, address _address) internal {
		require(_address != address(0), 'PullPaymentUtils: CANNOT_EXCEPT_ZERO_ADDRESS');

		(bool isExists, ) = isAddressExists(_list, _address);
		require(!isExists, 'PullPaymentUtils: ADDRESS_ALREADY_EXISTS');

		_list.push(_address);
	}

	/**
	 * @notice This method allows user to remove the particular address from the address list.
	 * @param _list 		- storage reference to address list
	 * @param _item 		- indicates the address to remove.
	 */
	function removeAddressFromList(address[] storage _list, address _item) internal {
		uint256 listItems = _list.length;
		require(listItems > 0, 'PullPaymentUtils: EMPTY_LIST');

		// check and remove if the last item is item to be removed.
		if (_list[listItems - 1] == _item) {
			_list.pop();
			return;
		}

		(bool isExists, uint256 index) = isAddressExists(_list, _item);
		require(isExists, 'PullPaymentUtils: ITEM_DOES_NOT_EXISTS');

		// move supported token to last
		if (listItems > 1) {
			address temp = _list[listItems - 1];
			_list[index] = temp;
		}

		//remove supported token
		_list.pop();
	}

	/**
	 * @notice This method allows to check if particular address exists in list or not
	 * @param _list - indicates list of addresses
	 * @param _item - indicates address to check in list
	 * @return isExists - returns true if item exists otherwise returns false. index - index of the existing item from the list.
	 */
	function isAddressExists(address[] storage _list, address _item)
		internal
		view
		returns (bool isExists, uint256 index)
	{
		for (uint256 i = 0; i < _list.length; i++) {
			if (_list[i] == _item) {
				isExists = true;
				index = i;
				break;
			}
		}
	}
}
