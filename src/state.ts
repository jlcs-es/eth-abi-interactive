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

    // Add a new account to the file, encrypted with the master password
    public async addAccount(alias: string, ac: Account) {
        const password = await vscode.window.showInputBox({
            prompt: `Password to encrypt ${alias}`,
            password: true
        });
        if (!password) {
            return;
        }
        const keys = this.privateKeys;
        keys.push({
            alias: alias,
            account: ac.encrypt(password)
        });
        
        writeFileSyncRecursive(this.privateKeysFile, JSON.stringify(keys, undefined, 2), 'utf8');
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

function writeFileSyncRecursive(filename: string, content: any, charset: string) {
    // -- normalize path separator to '/' instead of path.sep, 
    // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
    let filepath = filename.replace(/\\/g,'/');  

    // -- preparation to allow absolute paths as well
    let root = '';
    if (filepath[0] === '/') { 
        root = '/'; 
        filepath = filepath.slice(1);
    } 
    else if (filepath[1] === ':') { 
        root = filepath.slice(0,3);   // c:\
        filepath = filepath.slice(3); 
    }

    // -- create folders all the way down
    const folders = filepath.split('/').slice(0, -1);  // remove last item, file
    folders.reduce(
        (acc, folder) => {
            const folderPath = acc + folder + '/';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            return folderPath;
        },
        root // first 'acc', important
    ); 

    // -- write file
    fs.writeFileSync(root + filepath, content, charset);
}

