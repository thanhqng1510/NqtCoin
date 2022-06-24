const { Transaction } = require('./transaction');
const { Block } = require('./block');

class NqtCoin {
    #chain = null;
    #difficulty = null;
    #pendingTransactions = null;
    #miningReward = null;

    constructor() {
        this.#chain = [this.createGenesisBlock()];
        this.#difficulty = 5;
        this.#pendingTransactions = [];
        this.#miningReward = 10;
    }

    createGenesisBlock() {
        return new Block(Date.now());
    }

    getLastBlockHash() {
        return this.#chain[this.#chain.length - 1].getHash();
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.#chain)
            balance += block.getBalanceInBlockOfAddress(address)

        return balance;
    }

    dump() {
        return (this.#chain ?? []).reduce((prev, v) => {
            return prev + (v.dump() ?? '');
        }, '');
    }

    minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(null, miningRewardAddress, this.#miningReward);
        this.#pendingTransactions.push(rewardTx);

        const block = new Block(Date.now(), this.#pendingTransactions, this.getLastBlockHash());
        block.mineBlock(this.#difficulty);

        this.#chain.push(block);

        this.#pendingTransactions = [];
    }

    addTransaction(transaction) {
        if (!transaction.getSrcAddress() || !transaction.getDestAddress())
            throw new Error('Transaction must include source and destination address');

        if (!transaction.isValid())
            throw new Error('Cannot add invalid transaction to chain');

        if (transaction.getAmount() <= 0)
            throw new Error('Transaction amount should be higher than 0');

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


        this.#pendingTransactions.push(transaction);
    }

    isValid() {
        const realGenesis = JSON.stringify(this.createGenesisBlock());
        if (realGenesis !== JSON.stringify(this.#chain[0]))
            return false;

        for (let i = 1; i < this.#chain.length; ++i) {
            const currentBlock = this.#chain[i];
            const previousBlock = this.#chain[i - 1];

            if (previousBlock.getHash() !== currentBlock.getPreviousHash())
                return false;

            if (!currentBlock.isValid())
                return false;

            if (currentBlock.getHash() !== currentBlock.calculateHash())
                return false;
        }

        return true;
    }
}

module.exports.NqtCoin = NqtCoin;
