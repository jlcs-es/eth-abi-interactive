import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

class Status {
    public currentContract: string | undefined;
    public contractAddress: string | undefined;
    public privateKey: string | undefined;
    public web3: Web3 = new Web3();
    public contract: Contract | undefined;
    constructor(
        public endpoint: string
    ) {}
}

export const STATE = new Status(
    "http://localhost:8545"
);
