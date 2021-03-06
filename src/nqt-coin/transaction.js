const crypto = require('crypto');
const EC = require('elliptic').ec;

const ec = new EC('secp256k1');

class Transaction {
    #srcAddress = null;
    #destAddress = null;
    #amount = null;
    #timestamp = null;
    #signature = null;

    constructor(srcAddress, destAddress, amount) {
        if (!srcAddress || !destAddress)
            throw new Error('No address in this transaction');
        
        if (amount === null || amount === undefined || amount <= 0) 
            throw new Error('Invalid amount in this transaction');

        this.#srcAddress = srcAddress;
        this.#destAddress = destAddress;
        this.#amount = amount;
        this.#timestamp = Date.now();
    }

    getSrcAddress() {
        return this.#srcAddress;
    }

    getDestAddress() {
        return this.#destAddress;
    }

    getAmount() {
        return this.#amount;
    }

    getTimestamp() {
        return this.#timestamp;
    }

    dump() {
        return `Transaction\nFrom: ${this.#srcAddress}\nTo: ${this.#destAddress}\nAmount: ${this.#amount}\nTimestamp: ${Date(this.#timestamp).toString()}\n`;
    }

    calculateHash() {
        return crypto.createHash('sha256').update(this.#srcAddress + this.#destAddress + this.#amount + this.#timestamp).digest('hex');
    }

    signTransaction(keyPair) {
        if (keyPair.getPublic('hex') !== this.#srcAddress)
            throw new Error('Public key do not match');

        const hashTx = this.calculateHash();
        const sig = keyPair.sign(hashTx, 'base64');

        this.#signature = sig.toDER('hex');
    }

    isValid() {
        if (!this.#signature || this.#signature.length === 0)
            throw new Error('No signature in this transaction');

        const publicKey = ec.keyFromPublic(this.#srcAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.#signature);
    }
}

module.exports.Transaction = Transaction;
