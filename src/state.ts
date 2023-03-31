import * as vscode from 'vscode';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { Account } from 'web3-core';
import * as path from 'path';
import * as fs from 'fs';

class Status {
    // God, forgive me for these names, I'm too lazy to refactor at this point
    // May these comments be enough for my forgiveness
    public currentContract: string | undefined; // Current contract json ABI file selected
    public contractAddress: string | undefined; // Current Smart Contract deployed address
    public web3: Web3 = new Web3(); // Web3 instance
    public contract: Contract | undefined; // Current Smart Contract Web3 object
    public account: Account; // Current ethereum account to sign transactions
    public flag = false; // Flag to check if the user has selected a contract
    constructor() {
        // Default to a random account
        this.account = this.web3.eth.accounts.create();
        this.web3.eth.accounts.wallet.add(this.account);
    }

    // Get the ABI JSON Files' directory from settings
    public get contractsPath() : string {
        const conf = vscode.workspace.getConfiguration("eth-abi-interactive");
        if (conf.has("contractsPath")) {
            return conf.get("contractsPath") as string;
        }
        vscode.window.showErrorMessage("No contract path specified in settings");
        throw Error("No contract path specified in settings");
    }

    // Get the Accounts file from settings or load a default
    public get privateKeysFile() : string {
        const conf = vscode.workspace.getConfiguration("eth-abi-interactive");
        let p = undefined;
        if (conf.has("privateKeysFile")) {
            p = conf.get("privateKeysFile") as string;
        }
        if(!p || p.length === 0) {
            p = path.join(require('os').homedir(), '.eth-abi-interactive/keys.json');
            conf.update("privateKeysFile", p);
        }
        return p;
    }

    // Parse accounts from the file at settings or return default empty array
    public get privateKeys() : any[] {
        let keys = [];
        if(fs.existsSync(this.privateKeysFile)) {
            try {
                const contents = fs.readFileSync(this.privateKeysFile, 'utf8');
                keys = JSON.parse(contents);
            } catch(err) {
                vscode.window.showErrorMessage("Empty or invalid accounts file contents");
                keys = [];
            }
        }
        return keys;
    }

    // Get the Ethereum Node Endpoint from settings
    public get endpoint(): string {
        const conf = vscode.workspace.getConfiguration("eth-abi-interactive");
        if (conf.has("nodeURI")) {
            return conf.get("nodeURI") as string;
        }
        vscode.window.showErrorMessage("No Ethereum node URI specified in settings");
        throw Error("No Ethereum node URI specified in settings");
    }

    // Store the Ethereum Node Endpoint in settings
    public set endpoint(newval : string) {
        const conf = vscode.workspace.getConfiguration("eth-abi-interactive");
        conf.update("nodeURI", newval);
    }

}

export const STATE = new Status(); // Singleton

