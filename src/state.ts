import * as vscode from 'vscode';
import { Contract } from 'ethers';

class Status {
    // God, forgive me for these names, I'm too lazy to refactor at this point
    // May these comments be enough for my forgiveness
    public currentContract: string | undefined; // Current contract json ABI file selected
    public contractAddress: string | undefined; // Current Smart Contract deployed address
    public contract: Contract | undefined; // Current Smart Contract Web3 object
    public flag = false; // Flag to check if the user has selected a contract
    constructor() {}

    // Get the ABI JSON Files' directory from settings
    public get contractsPath() : string {
        const conf = vscode.workspace.getConfiguration("sol-exec");
        if (conf.has("contractsPath")) {
            return conf.get("contractsPath") as string;
        }
        vscode.window.showErrorMessage("No contract path specified in settings");
        throw Error("No contract path specified in settings");
    }

}

export const STATE = new Status(); // Singleton

