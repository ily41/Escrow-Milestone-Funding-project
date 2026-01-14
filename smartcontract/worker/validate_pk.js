const { ethers } = require('ethers');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pk = process.env.PRIVATE_KEY;
console.log('PK Length:', pk ? pk.length : 'null');
console.log('PK starting with 0x:', pk ? pk.startsWith('0x') : 'false');

try {
    const wallet = new ethers.Wallet(pk.trim());
    console.log('Wallet Address:', wallet.address);
} catch (e) {
    console.error('Wallet creation error:', e.message);
}
