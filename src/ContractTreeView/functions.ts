import { STATE } from "../state";
import * as vscode from "vscode";
import * as fs from "fs";
import { Contract, Wallet } from "ethers";
import { Contract as ContractTreeItem } from "./ContractTreeDataProvider";
import { getSourceName } from "../utils/functions";
import { ContractFactory } from "ethers";

let ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;

const useContract = async (
    node: ContractTreeItem,
    abiTreeDataProvider: any,
    abiTreeView: any,
    pendingTransactionDataProvider: any,
    pendingTransactionTreeView: any,
    constructorTreeDataProvider: any,
    constructorTreeView: any
) => {
    const isFilePresent = await getSourceName(node.label);
    if (isFilePresent === false) {
        await api.contract.selectContract(node.label);
    }
    const address = await api.contract.getContractAddress(node.label);
    STATE.currentContract = node.label;
    STATE.contractAddress = address;
    abiTreeDataProvider.refresh();
    abiTreeView.description = `${node.label} @ ${address}`;
    abiTreeView.message = undefined;
    constructorTreeDataProvider.refresh();
    constructorTreeView.description = `${node.label} @ ${address}`;
    // check if constructor tree viee has childern if not then show message
    constructorTreeView.message = undefined;
    pendingTransactionDataProvider.refresh();
    pendingTransactionTreeView.description = `${node.label} @ ${address}`;
    pendingTransactionTreeView.message = undefined;
    STATE.flag = true;
}

const refreshContract = async (node: ContractTreeItem, contractTreeDataProvider: any): Promise<vscode.TreeView<ContractTreeItem>> => {
    return vscode.window.createTreeView("eth-abi-interactive.contracts", { treeDataProvider: contractTreeDataProvider, });
}

const deployContract = async () => {
    const provider = await api.provider.get();
    const wallet = await api.wallet.get();
    const compiledOutput = await vscode.workspace.findFiles(`**/${STATE.currentContract}.json`, '', 1);
    console.log(compiledOutput[0].fsPath);
    const abi = JSON.parse(fs.readFileSync(compiledOutput[0].fsPath, "utf8")).abi;
    const bytecode = JSON.parse(fs.readFileSync(compiledOutput[0].fsPath, "utf8")).bytecode;
    console.log(abi);
    console.log(bytecode);
    const factory = new ContractFactory(abi, bytecode, wallet);
    let contract;
    const param = [];
    let constructor;
    try {
        constructor = await api.contract.getConstructorInput(STATE.currentContract);
        for (let ele of constructor) {
            console.log(ele.value);
            param.push(ele.value);
        }
        contract = await factory.deploy(...param);
        await contract.deployTransaction.wait()
    } catch (error: any) {
        console.log("No constructor input file found");
        contract = await factory.deploy();
        await contract.deployTransaction.wait();
    }
    console.log("Contract deployed to address:", contract?.address);
    return contract?.address;

};

export {
    useContract,
    refreshContract,
    deployContract
};