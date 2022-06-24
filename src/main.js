const { NqtCoin } = require('./nqt-coin/nqt-coin');
const { Transaction } = require('./nqt-coin/transaction');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Your private key goes here
const myKey = ec.keyFromPrivate('81ec35c12733143f167804a06126f5fbd268aee5c7d46eb2b0138a9d5dc6836e');

// From that we can calculate your public key (which doubles as your wallet address)
const myWalletAddress = myKey.getPublic('hex');

const chain = new NqtCoin();

// Mine first block
chain.minePendingTransactions(myWalletAddress);

// Create a transaction & sign it with your key
const tx1 = new Transaction(myWalletAddress, 'address2', 10);
tx1.signTransaction(myKey);
chain.addTransaction(tx1);

// Mine block
chain.minePendingTransactions(myWalletAddress);

// Create second transaction
const tx2 = new Transaction(myWalletAddress, 'address1', 5);
tx2.signTransaction(myKey);
chain.addTransaction(tx2);

// Mine block
chain.minePendingTransactions(myWalletAddress);
console.log(`Balance is ${chain.getBalanceOfAddress(myWalletAddress)}\n`);

// Check if the chain is valid
console.log('Blockchain valid ?', chain.isValid() ? 'Yes\n' : 'No\n');

console.log('Chain dump');
console.log(chain.dump());
