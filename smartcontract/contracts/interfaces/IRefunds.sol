// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRefunds {
    function increaseRefund(uint256 projectId, address backer, uint256 amount) external;
    function consumeRefund(uint256 projectId, address backer) external returns (uint256);
}
