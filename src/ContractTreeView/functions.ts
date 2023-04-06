import { STATE } from "../state";
import * as vscode from "vscode";
import * as fs from "fs";
import { Contract, Wallet } from "ethers";
import { Contract as ContractTreeItem } from "./ContractTreeDataProvider";
import { getSourceName } from "../utils/functions";

let ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;

const useContract = async (
    node: ContractTreeItem,
    abiTreeDataProvider: any,
    abiTreeView: any,
    pendingTransactionDataProvider: any,
    pendingTransactionTreeView: any
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
    pendingTransactionDataProvider.refresh();
    pendingTransactionTreeView.description = `${node.label} @ ${address}`;
    pendingTransactionTreeView.message = undefined;
    STATE.flag = true;
}

const refreshContract = async (node: ContractTreeItem , contractTreeDataProvider: any): Promise<vscode.TreeView<ContractTreeItem>> => {
    return vscode.window.createTreeView("eth-abi-interactive.contracts", { treeDataProvider: contractTreeDataProvider, });
}

export {
    useContract,
    refreshContract
};