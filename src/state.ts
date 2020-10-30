import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { Account } from 'web3-core';
class Status {
    public currentContract: string | undefined;
    public contractAddress: string | undefined;
    public privateKey: string | undefined;
    public web3: Web3 = new Web3();
    public contract: Contract | undefined;
    public account: Account;
    constructor(
        public endpoint: string,
    ) {
        this.account = this.web3.eth.accounts.create();
        this.web3.eth.accounts.wallet.add(this.account);
    }
}

export const STATE = new Status(
    "http://localhost:8545"
);
