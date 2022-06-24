const crypto = require('crypto');

class Block {
    #timestamp = null
    #transactions = null
    #nonce = null
    #hash = null
    #previousHash = null

    constructor(timestamp, transactions, previousHash) {
        this.#timestamp = timestamp;
        this.#transactions = transactions;
        this.#nonce = 0;
        this.#hash = this.calculateHash();
        this.#previousHash = previousHash;
    }

    getHash() {
        return this.#hash;
    }

    getPreviousHash() {
        return this.#previousHash;
    }

    getBalanceInBlockOfAddress(address) {
        let balance = 0;

        for (const trans of this.#transactions ?? []) {
            if (trans.getSrcAddress() === address)
                balance -= trans.getAmount();

            if (trans.getDestAddress() === address)
                balance += trans.getAmount();
        }

        return balance;
    }

    dump() {
        return (this.#transactions ?? []).reduce((prev, v) => {
            return prev + (v.dump() ?? '');
        }, '');
    }

    calculateHash() {
        return crypto.createHash('sha256').update(this.#previousHash + this.#timestamp + JSON.stringify(this.#transactions ?? []) + this.#nonce).digest('hex');
    }

    mineBlock(difficulty) {
        while (!this.#hash?.substring(0, difficulty).split('').every((e) => e === '0')) {
            this.#nonce++;
            this.#hash = this.calculateHash();
        }
    }

    isValid() {
        return this.#transactions.every((tx) => tx.isValid());
    }
}

module.exports.Block = Block;
