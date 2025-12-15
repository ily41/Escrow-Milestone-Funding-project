import { ethers } from 'ethers';

const PROJECT_ESCROW_ABI = [
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
const LOCAL_PROJECT_ESCROW_ADDRESS = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';

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
    let onchainProjectId: number | undefined;
    for (const log of receipt.logs) {
        try {
            const parsed = contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data
            });
            console.log('Parsed log:', parsed?.name, parsed?.args);
            if (parsed?.name === 'ProjectCreated') {
                onchainProjectId = Number(parsed.args.projectId);
                console.log('Extracted onchainProjectId:', onchainProjectId);
                break;
            }
        } catch (e) {
            // Not a matching log, skip
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
