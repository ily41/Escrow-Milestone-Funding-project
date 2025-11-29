// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GovernanceLight
 * @dev Minimal voting logic per project+milestone.
 * ProjectEscrow will call this contract.
 */
contract GovernanceLight {
    address public escrow;

    struct VoteTally {
        uint256 yesWeight;
        uint256 noWeight;
    }

    // projectId => milestoneId => tally
    mapping(uint256 => mapping(uint256 => VoteTally)) public tallies;
    // projectId => milestoneId => backer => voted?
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;

    modifier onlyEscrow() {
        require(msg.sender == escrow, "Governance: only escrow");
        _;
    }

    constructor(address _escrow) {
        escrow = _escrow;
    }

    function setEscrow(address _escrow) external {
        escrow = _escrow;
    }

    function vote(
        uint256 projectId,
        uint256 milestoneId,
        address backer,
        bool approve,
        uint256 weight
    ) external onlyEscrow {
        require(!hasVoted[projectId][milestoneId][backer], "Governance: already voted");
        hasVoted[projectId][milestoneId][backer] = true;

        VoteTally storage t = tallies[projectId][milestoneId];
        if (approve) {
            t.yesWeight += weight;
        } else {
            t.noWeight += weight;
        }
    }

    function getTally(
        uint256 projectId,
        uint256 milestoneId
    ) external view returns (uint256 yesWeight, uint256 noWeight) {
        VoteTally memory t = tallies[projectId][milestoneId];
        return (t.yesWeight, t.noWeight);
    }
}
