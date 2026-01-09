import { ethers } from 'ethers';

// Types for window.ethereum
interface Window {
    ethereum?: any;
}

export const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            return {
                provider,
                signer,
                address: accounts[0]
            };
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            throw error;
        }
    } else {
        throw new Error("MetaMask is not installed");
    }
};

export const listLocalAccounts = async () => {
    try {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const accounts = await provider.listAccounts();
        return accounts.map(acc => acc.address);
    } catch (error) {
        console.error("Error listing local accounts:", error);
        return [];
    }
};

export const connectLocalWallet = async (addressOrIndex?: string | number) => {
    try {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const accounts = await provider.listAccounts();

        if (accounts.length === 0) {
            throw new Error("No accounts found on local node");
        }

        let signer;
        let address;

        if (typeof addressOrIndex === 'string') {
            const found = accounts.find(acc => acc.address.toLowerCase() === addressOrIndex.toLowerCase());
            if (!found) throw new Error("Account not found");
            signer = await provider.getSigner(found.address);
            address = found.address;
        } else if (typeof addressOrIndex === 'number') {
            signer = await provider.getSigner(addressOrIndex);
            address = accounts[addressOrIndex].address;
        } else {
            // Default to first
            signer = await provider.getSigner(0);
            address = accounts[0].address;
        }

        return {
            provider,
            signer,
            address
        };
    } catch (error) {
        console.error("Error connecting to Local Wallet:", error);
        throw error;
    }
};
