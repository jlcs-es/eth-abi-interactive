import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { STATE } from '../state';
const ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;
function createJsonObject(directoryPath: any) {
    const jsonObject: any = {};

    fs.readdirSync(directoryPath).forEach((functionName) => {
        const functionPath = path.join(`${directoryPath}`,`${functionName}`);

        jsonObject[functionName] = {};

        fs.readdirSync(functionPath).forEach((fileName) => {
            const filePath = path.join(`${functionPath}`,`${fileName}`);
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
                const tx = data.transactionName.split('\\')[1];
                jsonObject[functionName][tx].decoded[fileName] = {
                    path: filePath,
                };
            } else if (/^\d+_simulated_tx\.json$/.test(fileName)) {
                const tx = data.transactionName.split('\\')[1];
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
    const folderPath = path.join(basePath, `artifacts`,`sol-exec`,`${STATE.currentContract}.sol`);
    // if path does not exist console error
    if (!fs.existsSync(folderPath)) {
        console.log("-------------------------------------------------folderPath does not exist-------------------------------------------------");
        return;
    }
    const jsonObject: any = createJsonObject(`${folderPath}`);
    console.log('-------------------------------------------------jsonObject-------------------------------------------------');
    console.log(jsonObject);
    // write to file
    fs.writeFileSync(`${path.join(basePath, `artifacts`,`sol-exec`,`readTransaction.json`)}`, JSON.stringify(jsonObject, null, 4));
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

const sendTransactionJson = async (input: any , channel: vscode.OutputChannel) => {
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
export {
    read,
    editTransactionJson,
    deleteTransactionJson,
    sendTransactionJson
    
};