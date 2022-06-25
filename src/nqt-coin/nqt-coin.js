const { Transaction } = require('./transaction');
const { Block } = require('./block');
const EC = require('elliptic').ec;

const ec = new EC('secp256k1');

class NqtCoin {
    static get BLOCK_GENERATION_INTERVAL() {
        return 5000;
    }

    static get DIFFICULTY_ADJUSTMENT_INTERVAL() {
        return 100;
    }

    static get MIN_DIFFICULTY() {
        return 5;
    }

    #chain = null;
    #difficulty = null;
    #pendingTransactions = null;
    #miningReward = null;

    #MINT_KEY_PAIR = ec.genKeyPair();
    #MINT_PUBLIC_ADDRESS = this.#MINT_KEY_PAIR.getPublic('hex');

    #HOLDER_KEY_PAIR = ec.genKeyPair();

    constructor() {
        this.#chain = [this.createGenesisBlock()];
        this.#difficulty = NqtCoin.MIN_DIFFICULTY;
        this.#pendingTransactions = [];
        this.#miningReward = 10;
    }

    createGenesisBlock() {
        const initalCoinRelease = new Transaction(this.#MINT_PUBLIC_ADDRESS, this.#HOLDER_KEY_PAIR.getPublic('hex'), 1_000_000);
        initalCoinRelease.signTransaction(this.#MINT_KEY_PAIR);
        return new Block(0, [initalCoinRelease]);
    }

    getLastBlockHash() {
        return this.#chain[this.#chain.length - 1].getHash();
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.#chain)
            balance += block.getBalanceOfAddress(address);

        return balance;
    }

    dump() {
        return (this.#chain ?? []).reduce((prev, v) => {
            return prev + (v.dump() ?? '');
        }, '');
    }

    minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(this.#MINT_PUBLIC_ADDRESS, miningRewardAddress, this.#miningReward);
        rewardTx.signTransaction(this.#MINT_KEY_PAIR);
        this.addTransaction(rewardTx);

        const block = new Block(this.#chain.length, this.#pendingTransactions, this.getLastBlockHash());
        block.mineBlock(this.#difficulty);

        this.#chain.push(block);
        this.#pendingTransactions = [];

        if (this.#chain.length > 1)
            if (this.#chain[this.#chain.length - 1].getIndex() % NqtCoin.DIFFICULTY_ADJUSTMENT_INTERVAL === 0)
                this.updateDifficulty();
    }

    updateDifficulty() {
        if (this.#chain.length > 1) {
            const timeTaken = this.#chain[this.#chain.length - 1].getTimestamp() - this.#chain[this.#chain.length - 2].getTimestamp()
            
            if (timeTaken < NqtCoin.BLOCK_GENERATION_INTERVAL / 2)
                this.#difficulty += 1;
            else if (timeTaken > NqtCoin.BLOCK_GENERATION_INTERVAL * 2)
                this.#difficulty = max(this.#difficulty - 1, NqtCoin.MIN_DIFFICULTY);
        }
    }

    addTransaction(transaction) {
        if (!transaction.isValid())
            throw new Error('Cannot add invalid transaction to chain');
        
        if (transaction.getSrcAddress() === this.#MINT_PUBLIC_ADDRESS) {
            if (transaction.getAmount() !== this.#miningReward)
                throw new Error('Invalid reward in this minting transaction');
        }
        else {
            const walletBalance = this.getBalanceOfAddress(transaction.getSrcAddress());
            if (walletBalance < transaction.getAmount())
                throw new Error('Not enough balance');

            const pendingTxForWallet = this.#pendingTransactions.filter(tx => tx.getSrcAddress() === transaction.getSrcAddress());
            if (pendingTxForWallet.length > 0) {
                const totalPendingAmount = pendingTxForWallet
                    .map(tx => tx.getAmount())
                    .reduce((prev, curr) => prev + curr);
    
                const totalAmount = totalPendingAmount + transaction.getAmount();
                if (totalAmount > walletBalance)
                    throw new Error('Pending transactions for this wallet is higher than its balance.');
            }
        }

        this.#pendingTransactions.push(transaction);
    }

    isValid() {
        if (JSON.stringify(this.createGenesisBlock()) !== JSON.stringify(this.#chain[0]))
            return false;

        for (let i = 1; i < this.#chain.length; ++i) {
            const currentBlock = this.#chain[i];
            const previousBlock = this.#chain[i - 1];

            if (previousBlock.getHash() !== currentBlock.getPreviousHash())
                return false;

            if (previousBlock.getIndex() >= currentBlock.getIndex())
                return false;

            if (!currentBlock.isValid())
                return false;
        }

        return true;
    }
}

module.exports.NqtCoin = NqtCoin;
