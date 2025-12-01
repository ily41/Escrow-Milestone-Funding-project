// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Milestones
 * @dev Stores milestone data for each project.
 * For now it's a minimal stub. We'll wire logic later.
 */
contract Milestones {
    address public escrow; // ProjectEscrow contract

    struct Milestone {
        uint256 amountWei;
        bool exists;
        bool fundsReleased;
        bool isActivated;
    }

    // projectId => milestoneId => Milestone
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    // projectId => number of milestones
    mapping(uint256 => uint256) public milestoneCount;

    modifier onlyEscrow() {
        require(msg.sender == escrow, "Milestones: only escrow");
        _;
    }

    constructor(address _escrow) {
        escrow = _escrow;
    }

    function setEscrow(address _escrow) external {
        // in real version we'd restrict this (owner or onlyEscrow once).
        // For now keep it simple, we'll tighten later if needed.
        escrow = _escrow;
    }

    function createMilestone(
        uint256 projectId,
        uint256 amountWei
    ) external onlyEscrow returns (uint256 milestoneId) {
        milestoneId = milestoneCount[projectId];

        milestones[projectId][milestoneId] = Milestone({
            amountWei: amountWei,
            exists: true,
            fundsReleased: false,
            isActivated: false
        });

        // Increase count AFTER using the current index
        milestoneCount[projectId] = milestoneId + 1;
    }

    function activateMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external onlyEscrow {
        Milestone storage m = milestones[projectId][milestoneId];
        require(m.exists, "Milestones: not found");
        require(!m.isActivated, "Milestones: already activated");
        m.isActivated = true;
    }

    function markReleased(
        uint256 projectId,
        uint256 milestoneId
    ) external onlyEscrow {
        Milestone storage m = milestones[projectId][milestoneId];
        require(m.exists, "Milestones: not found");
        require(!m.fundsReleased, "Milestones: already released");
        m.fundsReleased = true;
    }

    function getMilestone(uint256 projectId, uint256 milestoneId)
        external
        view
        returns (uint256 amountWei, bool exists, bool fundsReleased, bool isActivated)
    {
        Milestone memory m = milestones[projectId][milestoneId];
        return (m.amountWei, m.exists, m.fundsReleased, m.isActivated);
    }


    

    
}
