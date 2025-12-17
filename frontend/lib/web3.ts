import { ethers } from 'ethers';

const PROJECT_ESCROW_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_milestones",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_governance",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_refunds",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_treasury",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "to",
                "type": "address"
            }
        ],
        "name": "FundsReleased",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            }
        ],
        "name": "MilestoneActivated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "MilestoneSubmitted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "backer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "PledgeMade",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "fundingGoal",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            }
        ],
        "name": "ProjectCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "backer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "RefundIssued",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "backer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "approve",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "weight",
                "type": "uint256"
            }
        ],
        "name": "VoteCast",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            }
        ],
        "name": "VotingStarted",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            }
        ],
        "name": "activateMilestone",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "fundingGoalWei",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "deadlineTimestamp",
                "type": "uint256"
            }
        ],
        "name": "createProject",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "governanceContract",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "milestonesContract",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nextProjectId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            }
        ],
        "name": "openVoting",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "platformFeeBps",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            }
        ],
        "name": "pledge",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "pledges",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "projects",
        "outputs": [
            {
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "fundingGoal",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "currentFunding",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            },
            {
                "internalType": "enum ProjectEscrow.ProjectStatus",
                "name": "status",
                "type": "uint8"
            },
            {
                "internalType": "bool",
                "name": "hasActiveMilestones",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            }
        ],
        "name": "refundMilestone",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "refundsContract",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            }
        ],
        "name": "releaseFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            }
        ],
        "name": "requestRefund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "newFeeBps",
                "type": "uint256"
            }
        ],
        "name": "setPlatformFeeBps",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "amountWei",
                "type": "uint256"
            }
        ],
        "name": "submitMilestone",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "treasuryContract",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "projectId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "approve",
                "type": "bool"
            }
        ],
        "name": "voteOnMilestone",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('MetaMask is not installed');
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return { provider, signer, address };
};

export const connectLocalWallet = async () => {
    // Connect to local Hardhat node
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

    // Get the first account from the node
    const signer = await provider.getSigner(0);
    const address = await signer.getAddress();

    return { provider, signer, address };
};

export const pledgeToProject = async (
    contractAddress: string,
    onChainProjectId: number,
    amountEth: string,
    walletType: 'metamask' | 'local' = 'metamask'
) => {
    let signer;

    if (walletType === 'local') {
        const result = await connectLocalWallet();
        signer = result.signer;
    } else {
        const result = await connectWallet();
        signer = result.signer;
    }

    const contract = new ethers.Contract(contractAddress, PROJECT_ESCROW_ABI, signer);

    const tx = await contract.pledge(onChainProjectId, {
        value: ethers.parseEther(amountEth)
    });

    return await tx.wait();
};

// Default contract address for local Hardhat node
const LOCAL_PROJECT_ESCROW_ADDRESS = '0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB';

export const deployProject = async (
    fundingGoalEth: string,
    deadlineTimestamp: number,
    walletType: 'metamask' | 'local',
    contractAddress?: string
) => {
    const address = contractAddress || LOCAL_PROJECT_ESCROW_ADDRESS;

    let signer;
    let chainId: string;

    if (walletType === 'metamask') {
        const result = await connectWallet();
        signer = result.signer;
        const network = await result.provider.getNetwork();
        chainId = network.chainId.toString();
    } else {
        const result = await connectLocalWallet();
        signer = result.signer;
        chainId = '31337'; // Hardhat default chainId
    }

    const contract = new ethers.Contract(address, PROJECT_ESCROW_ABI, signer);

    const fundingGoalWei = ethers.parseEther(fundingGoalEth);

    console.log('Creating project on-chain with goal:', fundingGoalWei.toString(), 'deadline:', deadlineTimestamp);

    const tx = await contract.createProject(fundingGoalWei, deadlineTimestamp);
    console.log('Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('Transaction confirmed. Logs:', receipt.logs.length);

    // Extract project ID from event logs
    console.log('Receipt logs:', JSON.stringify(receipt.logs, null, 2));

    // Debug: Print the expected topic hash for ProjectCreated
    try {
        const eventFragment = contract.interface.getEvent('ProjectCreated');
        console.log('Expected ProjectCreated topic hash:', eventFragment?.topicHash);
    } catch (err) {
        console.log('Could not get event fragment:', err);
    }

    let onchainProjectId: number | undefined;
    for (const log of receipt.logs) {
        try {
            // Use spread syntax to ensure topics is a plain array
            const topics = [...log.topics];
            const parsed = contract.interface.parseLog({
                topics: topics,
                data: log.data
            });
            console.log('Parsed log:', parsed?.name, parsed?.args);
            if (parsed?.name === 'ProjectCreated') {
                onchainProjectId = Number(parsed.args.projectId);
                console.log('Extracted onchainProjectId:', onchainProjectId);
                break;
            }
        } catch (e) {
            console.warn('Failed to parse log:', e);
        }
    }

    // If we couldn't parse the event, try to read nextProjectId - 1 from contract
    if (onchainProjectId === undefined) {
        console.warn('Could not extract projectId from logs, this may cause issues');
    }

    return {
        txHash: receipt.hash,
        onchainProjectId,
        chainId,
        contractAddress: address
    };
};

export const submitMilestone = async (
    onChainProjectId: number,
    title: string,
    amountEth: string,
    walletType: 'metamask' | 'local',
    contractAddress?: string
) => {
    const address = contractAddress || LOCAL_PROJECT_ESCROW_ADDRESS;

    let signer;

    if (walletType === 'local') {
        const result = await connectLocalWallet();
        signer = result.signer;
    } else {
        const result = await connectWallet();
        signer = result.signer;
    }

    const contract = new ethers.Contract(address, PROJECT_ESCROW_ABI, signer);
    const amountWei = ethers.parseEther(amountEth);

    console.log('Submitting milestone on-chain:', { onChainProjectId, title, amountWei: amountWei.toString() });

    const tx = await contract.submitMilestone(onChainProjectId, title, amountWei);
    console.log('Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('Transaction confirmed. Logs:', receipt.logs.length);

    // Extract milestone ID from event logs
    let onchainMilestoneId: number | undefined;
    for (const log of receipt.logs) {
        try {
            const topics = [...log.topics];
            const parsed = contract.interface.parseLog({
                topics: topics,
                data: log.data
            });
            console.log('Parsed log:', parsed?.name, parsed?.args);
            if (parsed?.name === 'MilestoneSubmitted') {
                onchainMilestoneId = Number(parsed.args.milestoneId);
                console.log('Extracted onchainMilestoneId:', onchainMilestoneId);
                break;
            }
        } catch (e) {
            console.warn('Failed to parse log:', e);
        }
    }

    if (onchainMilestoneId === undefined) {
        console.warn('Could not extract milestoneId from logs');
    }

    return {
        txHash: receipt.hash,
        onchainMilestoneId,
        contractAddress: address
    };
};

export const activateMilestone = async (
    onChainProjectId: number,
    onChainMilestoneId: number,
    walletType: 'metamask' | 'local',
    contractAddress?: string
) => {
    const address = contractAddress || LOCAL_PROJECT_ESCROW_ADDRESS;

    let signer;

    if (walletType === 'local') {
        const result = await connectLocalWallet();
        signer = result.signer;
    } else {
        const result = await connectWallet();
        signer = result.signer;
    }

    const contract = new ethers.Contract(address, PROJECT_ESCROW_ABI, signer);

    console.log('Activating milestone on-chain:', { onChainProjectId, onChainMilestoneId });

    const tx = await contract.activateMilestone(onChainProjectId, onChainMilestoneId);
    console.log('Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('Milestone activated. TxHash:', receipt.hash);

    return {
        txHash: receipt.hash
    };
};
