// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Treasury
 * @dev Receives platform fees from ProjectEscrow.
 */
contract Treasury {
    address public owner;

    event FeeReceived(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Treasury: only owner");
        _;
    }

    receive() external payable {
        emit FeeReceived(msg.sender, msg.value);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Treasury: insufficient balance");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Treasury: withdraw failed");
        emit Withdrawn(to, amount);
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
}
