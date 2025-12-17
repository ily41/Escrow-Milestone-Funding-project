// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IMilestones.sol";
import "./interfaces/IGovernanceLight.sol";
import "./interfaces/IRefunds.sol";
import "./interfaces/ITreasury.sol";

/**
 * Milestone-based crowdfunding with:
 * - Projects with funding goal & deadline
 * - Backers pledge ETH
 * - Creator submits milestones
 * - Backers vote approve / reject
 * - If approved, funds for that milestone are released
 * - If project fails, backers can refund
 *
 * CLEAN, SIMPLE, and SPRINT‑2 READY.
 */

contract ProjectEscrow {
    enum ProjectStatus { Active, Successful, Failed }

    // New modular contracts
    address public owner;

    address public milestonesContract;
    address public governanceContract;
    address public refundsContract;
    address public treasuryContract;
    

    constructor(

        address _milestones,
        address _governance,
        address _refunds,
        address _treasury
        ) {
            owner = msg.sender;

            milestonesContract = _milestones;
            governanceContract = _governance;
            refundsContract = _refunds;
            treasuryContract = _treasury;
        }


    struct Project {
        address creator;
        uint256 fundingGoal;
        uint256 currentFunding;
        uint256 deadline;
        ProjectStatus status;
        bool hasActiveMilestones;
    }


    uint256 public nextProjectId;
    uint256 public platformFeeBps;

    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public pledges;

    // ================= EVENTS =================

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        uint256 fundingGoal,
        uint256 deadline
    );

    event PledgeMade(
        uint256 indexed projectId,
        address indexed backer,
        uint256 amount
    );

    event MilestoneSubmitted(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        string title,
        uint256 amount
    );

    event MilestoneActivated(
        uint256 indexed projectId,
        uint256 indexed milestoneId
    );

    event VotingStarted(
        uint256 indexed projectId,
        uint256 indexed milestoneId
    );

    event VoteCast(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        address indexed backer,
        bool approve,
        uint256 weight
    );

    event FundsReleased(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        uint256 amount,
        address to
    );

    event RefundIssued(
        uint256 indexed projectId,
        address indexed backer,
        uint256 amount
    );

    // ================= HELPERS =================

    modifier onlyCreator(uint256 projectId) {
        require(msg.sender == projects[projectId].creator, "Not creator");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setPlatformFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high");
        platformFeeBps = newFeeBps;
    }
    // ================= CORE LOGIC =================

    function createProject(
        uint256 fundingGoalWei,
        uint256 deadlineTimestamp
    ) external returns (uint256) {
        require(fundingGoalWei > 0, "Goal must be > 0");
        require(deadlineTimestamp > block.timestamp, "Deadline must be future");

        uint256 id = nextProjectId++;
        projects[id] = Project({
            creator: msg.sender,
            fundingGoal: fundingGoalWei,
            currentFunding: 0,
            deadline: deadlineTimestamp,
            status: ProjectStatus.Active,
            hasActiveMilestones: false
        });

        emit ProjectCreated(id, msg.sender, fundingGoalWei, deadlineTimestamp);

        return id;
    }

    function pledge(uint256 projectId) external payable {
        Project storage p = projects[projectId];
        require(p.creator != address(0), "Project not found");
        require(block.timestamp < p.deadline, "Funding ended");
        require(msg.value > 0, "Send ETH");
        require(p.hasActiveMilestones, "No active milestones");

        p.currentFunding += msg.value;
        pledges[projectId][msg.sender] += msg.value;

        emit PledgeMade(projectId, msg.sender, msg.value);

        if (p.currentFunding >= p.fundingGoal) {
            p.status = ProjectStatus.Successful;
        }
    }

    function submitMilestone(
        uint256 projectId,
        string calldata title,
        uint256 amountWei
    ) external onlyCreator(projectId) {
        require(amountWei > 0, "Amount > 0");

        uint256 mileStoneId = IMilestones(milestonesContract).createMilestone(projectId, amountWei);

        emit MilestoneSubmitted(projectId, mileStoneId, title, amountWei);
    }

    function activateMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external onlyCreator(projectId) {
        IMilestones(milestonesContract).activateMilestone(projectId, milestoneId);
        projects[projectId].hasActiveMilestones = true;
        emit MilestoneActivated(projectId, milestoneId);
    }

    function voteOnMilestone(
        uint256 projectId,
        uint256 milestoneId,
        bool approve
    ) external {
        require(pledges[projectId][msg.sender] > 0, "Not backer");


        uint256 weight = pledges[projectId][msg.sender];

        IGovernanceLight(governanceContract).vote(
            projectId,
            milestoneId,
            msg.sender,
            approve,
            weight
        );

        emit VoteCast(projectId, milestoneId, msg.sender, approve, weight);
    }

    function openVoting(
        uint256 projectId,
        uint256 milestoneId
    ) external onlyCreator(projectId) {
         (
            ,
            bool exists,
            bool fundsReleased,
            bool isActivated,
            bool votingStarted
        ) = IMilestones(milestonesContract).getMilestone(projectId, milestoneId);

        require(exists, "No milestone");
        require(isActivated, "Not activated");
        require(!fundsReleased, "Already released");
        require(!votingStarted, "Voting already started");

        IMilestones(milestonesContract).startVoting(projectId, milestoneId);
        emit VotingStarted(projectId, milestoneId);
    }

    function releaseFunds(
        uint256 projectId,
        uint256 milestoneId
    ) external onlyCreator(projectId) {
        Project storage p = projects[projectId];

        // 1) Load milestone from Milestones.sol
        (
            uint256 amountWei,
            bool exists,
            bool fundsReleased,
            // bool isActivated // ignored
            ,
            bool votingStarted
        ) = IMilestones(milestonesContract).getMilestone(projectId, milestoneId);

        require(exists, "No milestone");
        require(votingStarted, "Voting not started");
        require(!fundsReleased, "Already released");
        require(address(this).balance >= amountWei, "Not enough escrow");

        // 2) Check governance vote from GovernanceLight
        (uint256 yesWeight, uint256 noWeight) =
            IGovernanceLight(governanceContract).getTally(projectId, milestoneId);

        require(yesWeight > noWeight, "Not approved");

        // 3) Mark milestone as released in Milestones.sol
        IMilestones(milestonesContract).markReleased(projectId, milestoneId);

        // 4) Calculate platform fee and creator amount
        uint256 fee = (amountWei * platformFeeBps) / 10_000; // bps -> percentage
        uint256 toCreator = amountWei - fee;

        // 5) Update escrow accounting for the full milestone amount
        p.currentFunding -= amountWei;

        // 6) Send fee to Treasury (if any)
        if (fee > 0) {
            (bool okFee, ) = payable(treasuryContract).call{value: fee}("");
            require(okFee, "Fee transfer failed");
        }

        // 7) Send remaining funds to creator
        (bool okCreator, ) = p.creator.call{value: toCreator}("");
        require(okCreator, "Transfer failed");

        // 8) Emit original event (still using full milestone amount)
        emit FundsReleased(projectId, milestoneId, amountWei, p.creator);
    }

    function refundMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external onlyCreator(projectId) {
        Project storage p = projects[projectId];

         (
            uint256 amountWei,
            bool exists,
            bool fundsReleased,
            bool isActivated,
            bool votingStarted
        ) = IMilestones(milestonesContract).getMilestone(projectId, milestoneId);

        require(exists, "No milestone");
        require(isActivated, "Not activated");
        require(!fundsReleased, "Already released");
        require(votingStarted, "Voting not started");

        // Check governance - must be failed
        (uint256 yesWeight, uint256 noWeight) =
            IGovernanceLight(governanceContract).getTally(projectId, milestoneId);

        require(noWeight >= yesWeight, "Voting passed, cannot refund");

        // "Refund" effectively means ensuring the funds stay in the project (they are already there)
        // and marking the milestone as closed/failed so it can't be released.
        // But simply "de-activating" it or marking released to 0 address might be cleaner?
        // Let's mark it released so it can't be released again, but WITHOUT sending funds out.
        // Wait, if we mark released, it implies funds left.
        // Actually, funds haven't left `p.currentFunding`. They are still there.
        // So we just need to ensure this milestone specifically is dead.
        // `IMilestones.markReleased` sets `fundsReleased = true`.
        // If we call that, checks prevent double release.
        // And since we DO NOT decrement `p.currentFunding`, the funds remain in the project pool.
        // This effectively "returns" them to the pool for future usage.

        IMilestones(milestonesContract).markReleased(projectId, milestoneId);

        emit RefundIssued(projectId, address(0), amountWei); // address(0) implies project pool
    }




    function requestRefund(uint256 projectId) external {
        Project storage p = projects[projectId];

        require(block.timestamp > p.deadline, "Not ended");
        require(p.currentFunding < p.fundingGoal, "Goal met");

        uint256 pledged = pledges[projectId][msg.sender];
        require(pledged > 0, "Nothing pledged");

        pledges[projectId][msg.sender] = 0;
        p.currentFunding -= pledged;

        IRefunds(refundsContract).increaseRefund(projectId, msg.sender, pledged);

        uint256 amount = IRefunds(refundsContract).consumeRefund(projectId, msg.sender);

        require(amount == pledged, "Refunds: mismatch");

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Refund failed");

        emit RefundIssued(projectId, msg.sender, amount);
}

}
