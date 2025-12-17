// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMilestones {
    function createMilestone(
        uint256 projectId,
        uint256 amountWei
    ) external returns (uint256 milestoneId);

    function activateMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external;

    function startVoting(
        uint256 projectId,
        uint256 milestoneId
    ) external;

    function markReleased(
        uint256 projectId,
        uint256 milestoneId
    ) external;

    function getMilestone(uint256 projectId, uint256 milestoneId)
        external
        view
        returns (uint256 amountWei, bool exists, bool fundsReleased, bool isActivated, bool votingStarted);
}
