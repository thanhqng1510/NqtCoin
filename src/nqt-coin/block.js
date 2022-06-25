const crypto = require('crypto');

class Block {
    #index = null;
    #timestamp = null;
    #transactions = null;
    #nonce = null;
    #previousHash = null;
    #hash = null;

    constructor(index, transactions, previousHash) {
        if (index === null || index === undefined || index < 0)
            throw new Error('Invalid index in this block');
        
        if (!transactions || transactions.length === 0) 
            throw new Error('Invalid transactions in this block');

        if (index !== 0 && !previousHash) 
            throw new Error('Invalid previous hash in this block');

        this.#index = index;
        this.#timestamp = Date.now();
        this.#transactions = transactions;
        this.#nonce = 0;
        this.#previousHash = previousHash;
        this.#hash = this.calculateHash();
    }

    getHash() {
        return this.#hash;
    }

    getPreviousHash() {
        return this.#previousHash;
    }

    getIndex() {
        return this.#index;
    }

    getTimestamp() {
        return this.#timestamp;
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const trans of this.#transactions) {
            if (trans.getSrcAddress() === address)
                balance -= trans.getAmount();

            if (trans.getDestAddress() === address)
                balance += trans.getAmount();
        }

        return balance;
    }

    dump() {
        return `Block ${this.#index} - Hash ${this.getHash()}\n${(this.#transactions).reduce((prev, v) => {
            return prev + v.dump();
        }, '')}`;
    }

    calculateHash() {
        return crypto.createHash('sha256').update(this.#index + this.#previousHash + this.#timestamp + JSON.stringify(this.#transactions) + this.#nonce).digest('hex');
    }

    mineBlock(difficulty) {
        while (!this.#hash?.substring(0, difficulty).split('').every((e) => e === '0')) {
            this.#nonce++;
            this.#hash = this.calculateHash();
        }
    }

    isValid() {
        return this.#transactions.every((tx) => tx.isValid()) && this.#hash === this.calculateHash();
    }
}

module.exports.Block = Block;
