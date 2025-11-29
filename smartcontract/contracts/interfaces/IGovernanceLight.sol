// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGovernanceLight {
    function vote(
        uint256 projectId,
        uint256 milestoneId,
        address backer,
        bool approve,
        uint256 weight
    ) external;

    function getTally(uint256 projectId, uint256 milestoneId) external view returns (uint256, uint256);
}
