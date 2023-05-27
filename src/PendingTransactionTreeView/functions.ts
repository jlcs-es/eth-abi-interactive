import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { STATE } from '../state';
import { ethers } from 'ethers';
import { checkFolder } from '../AbiTreeView/functions';
const ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;
function createJsonObject(directoryPath: any) {
    const jsonObject: any = {};

    fs.readdirSync(directoryPath).forEach((functionName) => {
        const functionPath = path.join(`${directoryPath}`, `${functionName}`);

        jsonObject[functionName] = {};

        fs.readdirSync(functionPath).forEach((fileName) => {
            const filePath = path.join(`${functionPath}`, `${fileName}`);
            const fileContent = fs.readFileSync(filePath);
            const data = JSON.parse(fileContent.toString());
            console.log(filePath);
            if (/^\d+_tx\.json$/.test(fileName)) {
                jsonObject[functionName][fileName] = {
                    path: filePath,
                    decoded: {},
                    simulated: {},
                };
            } else if (/^\d+_decoded_tx\.json$/.test(fileName)) {
                const tx = data.transactionName.split('|')[1];
                jsonObject[functionName][tx].decoded[fileName] = {
                    path: filePath,
                };
            } else if (/^\d+_simulated_tx\.json$/.test(fileName)) {
                const tx = data.transactionName.split('|')[1];
                jsonObject[functionName][tx].simulated[fileName] = {
                    path: filePath,
                };
            }
        });
    });

    return jsonObject;
}

const read = async () => {
    const basePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (basePath === undefined) {
        throw new Error("No workspace folder found");
    }
    const folderPath = path.join(basePath, `artifacts`, `sol-exec`, `${STATE.currentContract}.sol`);
    // if path does not exist console error
    if (!fs.existsSync(folderPath)) {
        console.log("-------------------------------------------------folderPath does not exist-------------------------------------------------");
        return;
    }
    const jsonObject: any = createJsonObject(`${folderPath}`);
    console.log('-------------------------------------------------jsonObject-------------------------------------------------');
    console.log(jsonObject);
    // write to file
    fs.writeFileSync(`${path.join(basePath, `artifacts`, `sol-exec`, `readTransaction.json`)}`, JSON.stringify(jsonObject, null, 4));
    return jsonObject;
};

const editTransactionJson = async (input: any) => {
    const document = await vscode.workspace.openTextDocument(input.path);
    const editor = await vscode.window.showTextDocument(document);
    editor.revealRange(new vscode.Range(0, 0, 0, 0));
};

const deleteTransactionJson = (input: any) => {
    // delete file
    fs.unlinkSync(input.path);
    console.log('-------------------------------------------------deleteTransactionJson-------------------------------------------------');
};

const sendTransactionJson = async (input: any, channel: vscode.OutputChannel) => {
    const wallet: any = await api.wallet.get();
    console.log("Wallet address : ", wallet.address);
    // read file
    const transaction = fs.readFileSync(input.path);
    const data = JSON.parse(transaction.toString());
    console.log(data);
    wallet.sendTransaction(data).then((result: any) => {
        channel.appendLine(`Transaction hash: ${result.hash}`);
    }).catch((error: any) => {
        if (error.reason === undefined) {
            channel.appendLine(`Error: ${error.message}`);
        } else {
            channel.appendLine(`Error: ${error.reason}`);
        }
    });
};

const decode = async (input: any, channel: vscode.OutputChannel) => {
    try {
        const fileContents = fs.readFileSync(input.path, 'utf-8');
        const data = JSON.parse(fileContents);
        console.log(data);
        const contractAbi = await api.contract.abi(STATE.currentContract);
        const iface = new ethers.utils.Interface(contractAbi);
        const decodedData = iface.parseTransaction(data);
        console.log(decodedData);
        return decodedData;
    } catch (error: any) {
        if (error.reason === undefined) {
            channel.appendLine(`Error: ${error.message}`);
            console.log(`Error: ${error}`);
        } else {
            channel.appendLine(`Error: ${error.reason}`);
            console.log(`Error: ${error}`);
        }
    }
};

const writeDecodedTransaction = async (decodedTransaction: any, input: any) => {
    try {
        console.log(typeof decodedTransaction);
        const folderPath = await checkFolder(`${input.parent.functionName}`);
        const epochTime = Date.now();
        console.log(epochTime);
        const decodedTx = {
            transactionName: `${input.parent.functionName}|${input.label}`,
            result: decodedTransaction,
        };
        fs.writeFileSync(
            path.join(`${folderPath}`, `${epochTime}_decoded_tx.json`),
            JSON.stringify(decodedTx),
        );
        return path.join(`${folderPath}`, `${epochTime}_decoded_tx.json`);
    } catch (error: any) {
        if (error.reason === undefined) {
            console.log(`Error: ${error.message}`);
        } else {
            console.log(`Error: ${error.reason}`);
        }
    }
};
const writeSimulatedTransaction = async (simulatedTransaction: any, input: any) => {
    try {
        console.log(typeof simulatedTransaction);
        const folderPath = await checkFolder(`${input.parent.functionName}`);
        const epochTime = Date.now();
        console.log(epochTime);
        const decodedTx = {
            transactionName: `${input.parent.functionName}|${input.label}`,
            result: simulatedTransaction,
        };
        fs.writeFileSync(
            path.join(`${folderPath}`, `${epochTime}_simulated_tx.json`),
            JSON.stringify(decodedTx),
        );
        return path.join(`${folderPath}`, `${epochTime}_simulated_tx.json`);
    } catch (error: any) {
        if (error.reason === undefined) {
            console.log(`Error: ${error.message}`);
        } else {
            console.log(`Error: ${error.reason}`);
        }
    }
};
const decodeTransactionJson = async (input: any, channel: vscode.OutputChannel) => {
    try {
        console.log(input);
        const decodedData = await decode(input, channel);
        console.log(decodedData);
        const decodedTxPath = await writeDecodedTransaction(decodedData, input);
        console.log(decodedTxPath);
        channel.appendLine(`Decoded transaction path: ${decodedTxPath}`);
    } catch (error: any) {
        if (error.reason === undefined) {
            channel.appendLine(`Error: ${error.message}`);
            console.log(`Error: ${error}`);
        } else {
            channel.appendLine(`Error: ${error.reason}`);
            console.log(`Error: ${error}`);
        }
    }
};

const simulate = async (input: any, channel: vscode.OutputChannel) => {
    try {
        const wallet: any = await api.wallet.get();
        console.log("Wallet address : ", wallet.address);
        const provider = await api.provider.get();
        // read file
        const transaction = fs.readFileSync(input.path);
        const txObject = JSON.parse(transaction.toString());
        console.log(txObject);
        txObject.gasPrice = ethers.BigNumber.from(txObject.gasPrice.hex);
        txObject.gasLimit = ethers.BigNumber.from(txObject.gasLimit.hex);
        txObject.value = ethers.BigNumber.from(txObject.value.hex);
        txObject.nonce = await wallet.getTransactionCount();
        const chainId = await provider.getNetwork();
        txObject.chainId = chainId.chainId;
        console.log(txObject);
        const signedTx = await wallet.signTransaction(txObject);
        const txResponse = await provider.sendTransaction(signedTx);
        return txResponse;
    } catch (error: any) {
        if (error.reason === undefined) {
            channel.appendLine(`Error: ${error.message}`);
            console.log(`Error: ${error}`);
        } else {
            channel.appendLine(`Error: ${error.reason}`);
            console.log(`Error: ${error}`);
        }
    }
};

const simulateTransactionJson = async (input: any, channel: vscode.OutputChannel) => {
    try {
        console.log(input);
        const simulatedData = await simulate(input, channel);
        console.log(simulatedData);
        const simulatedTxPath = await writeSimulatedTransaction(simulatedData, input);
        console.log(simulatedTxPath);
        channel.appendLine(`Simulated transaction path: ${simulatedTxPath}`);
    } catch (error: any) {
        if (error.reason === undefined) {
            channel.appendLine(`Error: ${error.message}`);
            console.log(`Error: ${error}`);
        } else {
            channel.appendLine(`Error: ${error.reason}`);
            console.log(`Error: ${error}`);
        }
    }
};

export {
    read,
    editTransactionJson,
    deleteTransactionJson,
    sendTransactionJson,
    decodeTransactionJson,
    simulateTransactionJson

};