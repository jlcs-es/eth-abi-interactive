import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { STATE } from '../state';

function createJsonObject(directoryPath: any) {
    const jsonObject: any = {};

    fs.readdirSync(directoryPath).forEach((functionName) => {
        const functionPath = `${directoryPath}\\${functionName}`;

        jsonObject[functionName] = {};

        fs.readdirSync(functionPath).forEach((fileName) => {
            const filePath = `${functionPath}\\${fileName}`;
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
    const folderPath = path.join(basePath, `artifacts\\sol-exec\\${STATE.currentContract}.sol`);
    // if path does not exist console error
    if (!fs.existsSync(folderPath)) {
        console.log("-------------------------------------------------folderPath does not exist-------------------------------------------------");
        return;
    }
    const jsonObject: any = createJsonObject(`${folderPath}`);
    console.log('-------------------------------------------------jsonObject-------------------------------------------------');
    console.log(jsonObject);
    // write to file
    fs.writeFileSync(`${path.join(basePath, `artifacts\\sol-exec`)}/readTransaction.json`, JSON.stringify(jsonObject, null, 4));
};
export {
    read,
};