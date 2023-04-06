import { STATE } from "../state";
import { Abi } from "./AbiTreeDataProvider";
import * as vscode from "vscode";
import * as fs from "fs";
import { Contract, Wallet } from "ethers";

let ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;

async function search(filePath: string, searchString: string, startLine: number = 0) {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const start = text.indexOf(searchString, document.offsetAt(new vscode.Position(startLine, 0)));
    const startPosition = document.positionAt(start);
    return startPosition;
}

async function executeTransaction(contractAddress: string, abi: any[], wallet: Wallet, functionName: string, args: any[]) {
    console.log('.................executeTransaction.................');
    const contract = new Contract(contractAddress, abi, wallet);
    console.log(contract);
    const tx = await contract[functionName](...args);
    console.log(tx);
    const txResponse = await tx.wait();
    return txResponse;
}

async function callContractFunction(contractAddress: string, abi: any[], functionName: string, args: any[]) {
    console.log('.................callContract.................');
    const ethcodeProvider = await api.provider.get();
    console.log(contractAddress);
    const contract = new Contract(contractAddress, abi, ethcodeProvider);
    console.log(contract);
    console.log(functionName);
    console.log(args);
    const result = await contract[functionName](...args);
    return result;
}


const editInput = async (input: Abi, abiTreeDataProvider: any) => {
    let filePath = "";
    let path = await vscode.workspace.findFiles(`**/${STATE.currentContract}_functions_input.json`);
    filePath = path[0].fsPath;
    console.log(filePath);

    const document = await vscode.workspace.openTextDocument(filePath);

    console.log(input);

    let lineNumber = await search(filePath, `"name": "${input.parent?.label}"`);
    console.log(lineNumber, `"name": "${input.parent?.label}"`);
    let line = await search(filePath, `"name": "${input.abi.name}"`, lineNumber.line);
    console.log(line, `"name": "${input.abi.name}"`);

    const cursorPosition = new vscode.Position(line.line + 2, line.character + 10);
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(cursorPosition, cursorPosition);
    editor.revealRange(new vscode.Range(cursorPosition, cursorPosition));

    abiTreeDataProvider.refresh(input);
};

const sendTransaction = async (func: Abi, channel: vscode.OutputChannel) => {
    channel.appendLine("####################################################################################");
    channel.appendLine(`Sending transaction ${func.abi.name} ...`);
    console.log(func);

    let wallet: any = await api.wallet.get();
    channel.appendLine(`Wallet : ${wallet.address}`);

    let abi = await api.contract.abi(STATE.currentContract);
    console.log(abi);

    let contractAddress = await api.contract.getContractAddress(STATE.currentContract);
    console.log(contractAddress);

    // execute the selected function
    let functionArgs: any = [];
    func.children.forEach((item: Abi) => {
        functionArgs.push(item.abi.value);
    });
    console.log(functionArgs);


    executeTransaction(contractAddress, abi, wallet, func.abi.name, functionArgs).then((txResponse: any) => {
        console.log(txResponse);
        channel.appendLine(`Transaction hash : ${txResponse.transactionHash}`);
    }).catch((err: any) => {
        console.log(err);
        channel.appendLine(`Error : ${err}`);
    });
    channel.appendLine("####################################################################################");
    channel.show(true);
}

const callContract = async (func: Abi, channel: vscode.OutputChannel) => {
    console.log("~~~~~~~~~~~~~~ Will call read function ~~~~~~~~~~~~~~");
    const abi = await api.contract.abi(STATE.currentContract);
    const contractAddress = await api.contract.getContractAddress(STATE.currentContract);
    const functionArgs: any = [];
    func.children.forEach((item: Abi) => {
        functionArgs.push(item.abi.value);
    });
    callContractFunction(contractAddress, abi, func.abi.name, functionArgs).then((response: any) => {
        channel.appendLine(`Contract call result : ${response}`);
    }).catch((err: any) => {
        console.error(err);
        channel.appendLine(`Error : ${err}`);
    });
    channel.appendLine("####################################################################################");
    channel.show(true);
}

export {
    editInput,
    sendTransaction,
    callContract
};