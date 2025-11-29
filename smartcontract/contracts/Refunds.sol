// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Refunds
 * @dev Tracks refundable balances for backers.
 * ProjectEscrow remains the contract that actually sends ETH.
 */
contract Refunds {
    address public escrow;

    // projectId => backer => refundable amount
    mapping(uint256 => mapping(address => uint256)) public refundable;

    modifier onlyEscrow() {
        require(msg.sender == escrow, "Refunds: only escrow");
        _;
    }

    constructor(address _escrow) {
        escrow = _escrow;
    }

    function setEscrow(address _escrow) external {
        escrow = _escrow;
    }

    function increaseRefund(
        uint256 projectId,
        address backer,
        uint256 amount
    ) external onlyEscrow {
        refundable[projectId][backer] += amount;
    }

    function consumeRefund(
        uint256 projectId,
        address backer
    ) external onlyEscrow returns (uint256 amount) {
        amount = refundable[projectId][backer];
        refundable[projectId][backer] = 0;
    }
}
