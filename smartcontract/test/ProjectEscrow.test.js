const {
  expect
} = require("chai");
const {
  ethers
} = require("hardhat");
const {
  time,
  loadFixture
} = require("@nomicfoundation/hardhat-network-helpers");

describe("ProjectEscrow – Modular Architecture Test Suite", function () {

  async function deployFixture() {
    // 1. Load test accounts
    const [creator, backer1, backer2, rando] = await ethers.getSigners();

    // 2. Deploy helper contracts
    const Milestones = await ethers.getContractFactory("Milestones", creator);
    const milestones = await Milestones.deploy(creator.address);
    await milestones.waitForDeployment();

    const Governance = await ethers.getContractFactory("GovernanceLight", creator);
    const governance = await Governance.deploy(creator.address);
    await governance.waitForDeployment();

    const Refunds = await ethers.getContractFactory("Refunds", creator);
    const refunds = await Refunds.deploy(creator.address);
    await refunds.waitForDeployment();

    const Treasury = await ethers.getContractFactory("Treasury", creator);
    const treasury = await Treasury.deploy();
    await treasury.waitForDeployment();

    // 3. Deploy main contract (ProjectEscrow)
    const Escrow = await ethers.getContractFactory("ProjectEscrow", creator);
    const escrow = await Escrow.deploy(
      await milestones.getAddress(),
      await governance.getAddress(),
      await refunds.getAddress(),
      await treasury.getAddress()
    );
    await escrow.waitForDeployment();

    // 4. Wire helper contracts → escrow
    await milestones.setEscrow(await escrow.getAddress());
    await governance.setEscrow(await escrow.getAddress());
    await refunds.setEscrow(await escrow.getAddress());

    // 5. Disable platform fee (0%) so tests expect exact payouts
    await escrow.setPlatformFeeBps(0);

    // 6. Create a default sample project
    const now = await time.latest();
    const deadline = now + 86400; // 1 day later
    const goal = ethers.parseEther("1");

    await escrow.createProject(goal, deadline);
    const projectId = 0;

    // 7. Return all objects tests will use
    return {
      escrow,
      milestones,
      governance,
      refunds,
      treasury,
      creator,
      backer1,
      backer2,
      rando,
      projectId,
      goal,
      deadline,
    };
  }

  it("creates a project with correct params", async () => {
    const {
      escrow,
      creator,
      projectId,
      goal,
      deadline
    } = await loadFixture(deployFixture);

    const project = await escrow.projects(projectId);

    expect(project.creator).to.equal(creator.address);
    expect(project.fundingGoal).to.equal(goal);
    expect(project.deadline).to.equal(deadline);
  });


  it("reverts project creation if goal = 0", async () => {
    const {
      escrow
    } = await loadFixture(deployFixture);


    const now = await time.latest();
    const deadline = BigInt(now) + 1000n;

    await expect(
      escrow.createProject(0, deadline)
    ).to.be.revertedWith("Goal must be > 0");
  });

  it("reverts project creation if deadline is in the past", async () => {
    const {
      escrow
    } = await loadFixture(deployFixture);

    const now = await time.latest();
    const past = BigInt(now) - 1n; // 1 second before current time

    await expect(
      escrow.createProject(1n, past)
    ).to.be.revertedWith("Deadline must be future");
  });


  it("accepts pledges and tracks balances", async () => {
    const {
      escrow,
      projectId,
      backer1
    } = await loadFixture(deployFixture);

    const amount = ethers.parseEther("0.2");

    // Check ETH movement: backer loses ETH, escrow receives ETH
    await expect(
      escrow.connect(backer1).pledge(projectId, {
        value: amount
      })
    ).to.changeEtherBalances([backer1, escrow], [-amount, amount]);

    // Check stored value in contract
    const pledged = await escrow.pledges(projectId, backer1.address);
    expect(pledged).to.equal(amount);
  });


  it("reverts pledge after deadline", async () => {
    const {
      escrow,
      projectId,
      deadline,
      backer1
    } = await loadFixture(deployFixture);

    await time.increaseTo(BigInt(deadline) + 1n);

    await expect(
      escrow.connect(backer1).pledge(projectId, {
        value: 1
      })
    ).to.be.revertedWith("Funding ended");
  });

  it("only creator can submit milestones", async () => {
    const {
      escrow,
      projectId,
      creator,
      backer1
    } = await loadFixture(deployFixture);

    const amount = ethers.parseEther("0.05");

    // Creator can submit
    await expect(
      escrow.connect(creator).submitMilestone(projectId, "M1", amount)
    ).to.not.be.reverted;

    // Backer cannot
    await expect(
      escrow.connect(backer1).submitMilestone(projectId, "Oops", amount)
    ).to.be.revertedWith("Not creator");
  });

  it("reverts milestone submission with zero amount", async () => {
    const {
      escrow,
      projectId,
      creator
    } = await loadFixture(deployFixture);
    await expect(
      escrow.connect(creator).submitMilestone(projectId, "Zero", 0)
    ).to.be.revertedWith("Amount > 0");
  });

  // 8
  it("only backers can vote + duplicate vote reverts", async () => {
    const {
      escrow,
      projectId,
      creator,
      backer1,
      rando,
      governance
    } = await loadFixture(deployFixture);

    // Backer pledges, rando doesn't
    await escrow.connect(backer1).pledge(projectId, {
      value: ethers.parseEther("0.1")
    });

    // Creator submits milestone
    await escrow.connect(creator)
      .submitMilestone(projectId, "M1", ethers.parseEther("0.05"));

    const milestoneId = 0;

    // Rando tries to vote → must revert
    await expect(
      escrow.connect(rando).voteOnMilestone(projectId, milestoneId, true)
    ).to.be.revertedWith("Not backer");

    // Backer votes once → OK
    await expect(
      escrow.connect(backer1).voteOnMilestone(projectId, milestoneId, true)
    ).to.not.be.reverted;

    // Duplicate vote should revert
    await expect(
      escrow.connect(backer1).voteOnMilestone(projectId, milestoneId, true)
    ).to.be.revertedWith("Governance: already voted");
  });

  // 9
  it("accumulates weighted votes correctly", async () => {
    const {
      escrow,
      projectId,
      creator,
      backer1,
      governance
    } = await loadFixture(deployFixture);

    const pledgeAmt = ethers.parseEther("0.3");
    await escrow.connect(backer1).pledge(projectId, {
      value: pledgeAmt
    });

    await escrow.connect(creator).submitMilestone(
      projectId,
      "M1",
      ethers.parseEther("0.1")
    );

    // Vote
    await escrow.connect(backer1).voteOnMilestone(projectId, 0, true);

    const [yesVotes, noVotes] = await governance.getTally(projectId, 0);

    expect(yesVotes).to.equal(pledgeAmt);
    expect(noVotes).to.equal(0n);
  });

  // 10
  // 12
  it("refund works only after deadline + unmet goal", async () => {
  const { escrow, projectId, backer1, deadline } = await loadFixture(deployFixture);

  const pledge = ethers.parseUnits("0.1", 18); // BigNumber, not BigInt

  // 1) Backer pledges
  await escrow.connect(backer1).pledge(projectId, { value: pledge });

  // 2) Too early → revert
  await expect(
    escrow.connect(backer1).requestRefund(projectId)
  ).to.be.revertedWith("Not ended");

  // 3) Move time forward
  await time.increaseTo(BigInt(deadline) + 1n);

  // 4) Expect ETH balancing automatically (NO MANUAL GAS)
  await expect(
    escrow.connect(backer1).requestRefund(projectId)
  ).to.changeEtherBalances(
    [escrow, backer1],
    [-pledge, pledge]
  );

  // 5) Ensure pledge is cleared
  const pledgedAfter = await escrow.pledges(projectId, backer1.address);
  expect(pledgedAfter).to.equal(0);
});



  // 11
  it("reverts fund release if not approved", async () => {
    const {
      escrow,
      projectId,
      creator,
      backer1,
      milestones,
      governance
    } = await loadFixture(deployFixture);

    const pledgeAmt = ethers.parseEther("0.2");

    await escrow.connect(backer1).pledge(projectId, {
      value: pledgeAmt
    });

    await escrow.connect(creator)
      .submitMilestone(projectId, "M1", ethers.parseEther("0.1"));

    // No votes cast → should revert
    await expect(
      escrow.connect(creator).releaseFunds(projectId, 0)
    ).to.be.revertedWith("Not approved");
  });

  // 12
  it("refund works only after deadline + unmet goal", async () => {
    const {
      escrow,
      projectId,
      backer1,
      deadline
    } = await loadFixture(deployFixture);

    const pledge = ethers.parseEther("0.1");

    // 1) Backer pledges
    await escrow.connect(backer1).pledge(projectId, {
      value: pledge
    });

    // 2) Too early → should revert
    await expect(
      escrow.connect(backer1).requestRefund(projectId)
    ).to.be.revertedWith("Not ended");

    // 3) Move time past deadline
    await time.increaseTo(BigInt(deadline) + 1n);

    // 4) Now refund should succeed, and ETH should move:
    //    escrow loses pledge, backer gains pledge (gas handled by matcher)
    await expect(
      escrow.connect(backer1).requestRefund(projectId)
    ).to.changeEtherBalances(
      [escrow, backer1],
      [-pledge, pledge]
    );

    // 5) Pledge mapping should be zero after refund
    const pledgedAfter = await escrow.pledges(projectId, backer1.address);
    expect(pledgedAfter).to.equal(0);
  });


  // 13
  it("reverts refund if user pledged nothing", async () => {
    const {
      escrow,
      projectId,
      rando,
      deadline
    } = await loadFixture(deployFixture);

    await time.increaseTo(BigInt(deadline) + 1n);

    await expect(
      escrow.connect(rando).requestRefund(projectId)
    ).to.be.revertedWith("Nothing pledged");
  });

  // 14
  it("prevents releasing funds twice", async () => {
    const {
      escrow,
      projectId,
      creator,
      backer1,
      milestones,
      governance
    } = await loadFixture(deployFixture);

    const pledgeAmt = ethers.parseEther("0.2");
    const payout = ethers.parseEther("0.05");

    await escrow.connect(backer1).pledge(projectId, {
      value: pledgeAmt
    });

    await escrow.connect(creator).submitMilestone(projectId, "M1", payout);

    await escrow.connect(backer1).voteOnMilestone(projectId, 0, true);

    await escrow.connect(creator).releaseFunds(projectId, 0);

    await expect(
      escrow.connect(creator).releaseFunds(projectId, 0)
    ).to.be.revertedWith("Already released");
  });




})