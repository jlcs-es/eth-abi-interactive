import { STATE } from "../state";
import { Abi } from "./AbiTreeDataProvider";
import * as vscode from "vscode";
import * as fs from "fs";
import { Contract, Wallet } from "ethers";

const ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;

async function search(filePath: string, searchString: string, startLine: number = 0) {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const start = text.indexOf(searchString, document.offsetAt(new vscode.Position(startLine, 0)));
    const startPosition = document.positionAt(start);
    return startPosition;
}

async function executeTransaction(contractAddress: string, abi: any[], wallet: Wallet, functionName: string, args: any[]) {
    const contract = new Contract(contractAddress, abi, wallet);
    const tx = await contract[functionName](...args);
    const txResponse = await tx.wait();
    return txResponse;
}

async function callContractFunction(contractAddress: string, abi: any[], functionName: string, args: any[]) {
    const ethcodeProvider = await api.provider.get();
    const contract = new Contract(contractAddress, abi, ethcodeProvider);
    const result = await contract[functionName](...args);
    return result;
}


const editInput = async (input: Abi, abiTreeDataProvider: any) => {
    let filePath = "";
    const path = await vscode.workspace.findFiles(`**/${STATE.currentContract}_functions_input.json`);
    filePath = path[0].fsPath;

    const document = await vscode.workspace.openTextDocument(filePath);
    const lineNumber = await search(filePath, `"name": "${input.parent?.label}"`);
    const line = await search(filePath, `"name": "${input.abi.name}"`, lineNumber.line);

    const cursorPosition = new vscode.Position(line.line + 2, line.character + 10);
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(cursorPosition, cursorPosition);
    editor.revealRange(new vscode.Range(cursorPosition, cursorPosition));

    abiTreeDataProvider.refresh(input);
};

const sendTransaction = async (func: Abi, channel: vscode.OutputChannel) => {
    channel.appendLine(`Sending transaction ${func.abi.name} ...`);
    const functionName = func.abi.name;
    const totalArgsCount = func.children.length;
    let countArgs = 0;

    const wallet: any = await api.wallet.get();
    channel.appendLine(`Wallet : ${wallet.address}`);

    const abi = await api.contract.abi(STATE.currentContract);

    const contractAddress = await api.contract.getContractAddress(STATE.currentContract);

    if (contractAddress === "") {
        channel.appendLine("No Contract available. Please deploy a contract first.");
        return;
    }

    // execute the selected function
    const functionArgs: any = [];
    func.children.forEach((item: Abi) => {
        if(item.abi.value !== "") {
            functionArgs.push(item.abi.value);
            countArgs++;
        }
        else {
            channel.appendLine(`Error : ${functionName} function's ${item.abi.name} param is empty`);
        }
    });
    if (countArgs !== totalArgsCount) {
        channel.appendLine(`Error : ${functionName} function's arguments are not complete`);
        return;
    }

    executeTransaction(contractAddress, abi, wallet, func.abi.name, functionArgs).then((txResponse: any) => {
        console.log(txResponse);
        channel.appendLine(`Transaction hash : ${txResponse.transactionHash}`);
    }).catch((err: any) => {
        console.log(err);
        channel.appendLine(`Error : ${err}`);
    });
    channel.show(true);
};

const callContract = async (func: Abi, channel: vscode.OutputChannel) => {
    const abi = await api.contract.abi(STATE.currentContract);
    const contractAddress = await api.contract.getContractAddress(STATE.currentContract);
    const functionName = func.abi.name;
    const totalArgsCount = func.children.length;
    let countArgs = 0;
    if (contractAddress === "") {
        channel.appendLine("No Contract available. Please deploy a contract first.");
        return;
    }
    const functionArgs: any = [];
    func.children.forEach((item: Abi) => {
        if(item.abi.value !== "") {
            functionArgs.push(item.abi.value);
            countArgs++;
        }
        else {
            channel.appendLine(`Error : ${functionName} function's ${item.abi.name} param is empty`);
        }
    });

    if (countArgs !== totalArgsCount) {
        channel.appendLine(`Error : ${functionName} function's arguments are not complete`);
        return;
    }

    callContractFunction(contractAddress, abi, func.abi.name, functionArgs).then((response: any) => {
        channel.appendLine(`Contract call result : ${response}`);
    }).catch((err: any) => {
        console.error(err);
        channel.appendLine(`Error : ${err}`);
    });
    channel.show(true);
};

export {
    editInput,
    sendTransaction,
    callContract
};