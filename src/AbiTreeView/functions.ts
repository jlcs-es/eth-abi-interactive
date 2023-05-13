import { STATE } from "../state";
import { Abi } from "./AbiTreeDataProvider";
import * as vscode from "vscode";
import * as fs from "fs";
import { Contract, Wallet, ethers } from "ethers";
import { Signer } from "@ethersproject/abstract-signer";
import path from "path";

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
        if (item.abi.value !== "") {
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
        if (item.abi.value !== "") {
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


const generateContractTransaction = async (
    contractAddress: string,
    contractAbi: any,
    functionName: string,
    functionArgs: [],
    wallet: ethers.Wallet,
    provider: any,
    value: any,
) => {
    try {
        const contract = new ethers.Contract(contractAddress, contractAbi, wallet);
        const transaction = await contract.populateTransaction[functionName](
            ...functionArgs,
        );
        const nounce = await wallet.getTransactionCount();
        const gasLimit = await contract.estimateGas[functionName](...functionArgs);
        const gasPrice = await provider.getGasPrice();
        let chainId = await provider.getNetwork();
        chainId = chainId.chainId;
        const tx = {
            to: transaction.to,
            data: transaction.data,
            from: transaction.from,
            value: ethers.utils.parseEther(value.toString()),
            nonce: nounce,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            chainId: chainId,
        };
        return tx;
    } catch (error: any) {
        if (error.reason === undefined) {
            console.log(`Error: ${error.message}`);
        } else {
            console.log(`Error: ${error.reason}`);
        }
    }
};

const createTransactionObject = async (func: Abi, channel: vscode.OutputChannel) => {
    try {
        const contractAddress = await api.contract.getContractAddress(STATE.currentContract);
        const contractAbi = await api.contract.abi(STATE.currentContract);
        const functionName = func.abi.name;
        const totalArgsCount = func.children.length;
        let countArgs = 0;
        if (contractAddress === "") {
            channel.appendLine("No Contract available. Please deploy a contract first.");
            return;
        }
        const functionArgs: any = [];
        func.children.forEach((item: Abi) => {
            if (item.abi.value !== "") {
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

        const wallet: any = await api.wallet.get();
        const provider: any = await api.provider.get();
        const value: any = ethers.utils.parseEther("0");
        const tx = await generateContractTransaction(
            contractAddress,
            contractAbi,
            functionName,
            functionArgs,
            wallet,
            provider,
            value,
        );
        channel.appendLine(`Transaction: ${tx}`);
        return tx;
    } catch (error) {
        console.error(error);
    }
};  

const mainFolder = async () => {
    try {
        // const folderPath = path.join(__dirname, `artifacts\\contracts\\${STATE.currentContract}.sol` , 'sol-exec');
        // get folder pat of artifacts\\contracts\\${STATE.currentContract}.sol folder using vs code api
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('Please open a folder first to use this command.');
            return;
        }
        let mainpath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        mainpath = path.join(mainpath, 'artifacts', 'sol-exec');
        console.log(mainpath);
        if (!fs.existsSync(mainpath)) {
            fs.mkdirSync(mainpath);
            mainpath = path.join(mainpath,`${STATE.currentContract}`);
            if (!fs.existsSync(mainpath)) {
                fs.mkdirSync(mainpath);
                console.log('Folder created successfully');
            }
        } else {
            console.log('Folder already exists');
        }
        return mainpath;
        // if (!fs.existsSync(folderPath)) {
        //     fs.mkdirSync(folderPath);
        //     console.log('Folder created successfully');
        // } else {
        //     console.log('Folder already exists');
        // }
        // return folderPath;
    } catch (error: any) {
        if (error.reason === undefined) {
            console.log(`Error: ${error.message}`);
        } else {
            console.log(`Error: ${error.reason}`);
        }
    }
};

const checkFolder = async (folderName: any) => {
    try {
        const mainFolderPath: any = await mainFolder();
        const folderPath = path.join(mainFolderPath, folderName);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
        return folderPath;
    } catch (error: any) {
        if (error.reason === undefined) {
            console.log(`Error: ${error.message}`);
        } else {
            console.log(`Error: ${error.reason}`);
        }
    }
};

const writeTransaction = async (tx: any, functionName: any) => {
    try {
        console.log(typeof tx);
        const folderPath = await checkFolder(`${functionName}`);
        // const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(tx)));
        const epochTime = Date.now();
        console.log(epochTime);
        fs.writeFileSync(`${folderPath}\\${epochTime}_tx.json`, JSON.stringify(tx));
        return `${folderPath}\\${epochTime}_tx.json`;
    } catch (error: any) {
        if (error.reason === undefined) {
            console.log(`Error: ${error.message}`);
        } else {
            console.log(`Error: ${error.reason}`);
        }
    }
};

const create = async (func: Abi, channel: vscode.OutputChannel) => {
    channel.appendLine(`Creating transaction ${func.abi.name} ...`);
    const tx = await createTransactionObject(func,channel);
    console.log(tx);
    const path = await writeTransaction(tx,func.abi.name);
    console.log(path);
    channel.appendLine(`Transaction created successfully : ${path}`);
};

export {
    editInput,
    sendTransaction,
    callContract,
    create
};