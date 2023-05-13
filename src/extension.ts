import * as vscode from "vscode";
import * as fs from "fs";
import { ContractTreeDataProvider, Contract as ContractTreeItem } from "./ContractTreeView/ContractTreeDataProvider";
import { AbiTreeDataProvider, Abi } from "./AbiTreeView/AbiTreeDataProvider";
import { STATE } from "./state";
import { PendingTransactionTreeDataProvider } from "./PendingTransactionTreeView/NodeDependenciesProvider";
// import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import { getSourceName } from "./utils/functions";
import { Contract, ContractFactory, Wallet } from "ethers";
import { callContract, create, editInput, sendTransaction } from "./AbiTreeView/functions";
import { deployContract, editContractAddress, refreshContract, updateContractAddress, useContract } from "./ContractTreeView/functions";
import { ConstructorTreeDataProvider } from "./ConstructorTreeView/ConstructorTreeDataProvider";
import { editConstructorInput } from "./ConstructorTreeView/functions";

const ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;

export async function activate(context: vscode.ExtensionContext) {
  const path_ = vscode.workspace.workspaceFolders;

  if (path_ === undefined) {
    vscode.window.showErrorMessage("No folder selected please open one.");
    return;
  }

  const channel = vscode.window.createOutputChannel("Solidity execute!");

  // Contract Tree View
  const contractTreeDataProvider = new ContractTreeDataProvider(
    vscode.workspace.rootPath
  );

  let contractTreeView = vscode.window.createTreeView("sol-exec.contracts", {
    treeDataProvider: contractTreeDataProvider,
  });

  api.events.contracts.event(() => {
    contractTreeView = vscode.window.createTreeView("sol-exec.contracts", {
      treeDataProvider: contractTreeDataProvider,
    });
  });

  // Abi Tree View
  const abiTreeDataProvider = new AbiTreeDataProvider(
    vscode.workspace.rootPath
  );
  const abiTreeView = vscode.window.createTreeView("sol-exec.abis", {
    treeDataProvider: abiTreeDataProvider,
  });

  abiTreeView.message = "Select a contract and its ABI functions will appear here.";



  // constructor tree view
  const constructorTreeDataProvider = new ConstructorTreeDataProvider(
    vscode.workspace.rootPath
  );

  const constructorTreeView = vscode.window.createTreeView("sol-exec.constructor", {
    treeDataProvider: constructorTreeDataProvider,
  });

  constructorTreeView.message = "Select a contract and its constructor will appear here.";

  // pending transaction tree view
  const pendingTransactionDataProvider = new PendingTransactionTreeDataProvider();

  const pendingTransactionTreeView = vscode.window.createTreeView("sol-exec.pendingTxn", {
    treeDataProvider: pendingTransactionDataProvider,
  });

  pendingTransactionTreeView.message = "Select a contract and its pending transaction will appear here.";

  fs.watch(path_[0].uri.fsPath, { recursive: true }, (eventType, filename) => {
    console.log(`File ${filename} has been ${eventType}`);
    abiTreeDataProvider.refresh();
    contractTreeDataProvider.refresh();
    constructorTreeDataProvider.refresh();
    updateContractAddress(STATE.currentContract, abiTreeView, constructorTreeView, pendingTransactionTreeView);
  });

  // functions
  context.subscriptions.push(
    // abi
    vscode.commands.registerCommand('sol-exec.editInput', async (input: Abi) => {
      editInput(input, abiTreeDataProvider);
    }),
    vscode.commands.registerCommand('sol-exec.sendTransaction', async (func: Abi) => {
      sendTransaction(func, channel);
    }),
    vscode.commands.registerCommand('sol-exec.callContract', async (func: Abi) => {
      callContract(func, channel);
    }),
    // under development
    vscode.commands.registerCommand('sol-exec.createTransaction', async (func: Abi) => {
      console.log(func);
      await create(func, channel);
    }),
    // contract 
    vscode.commands.registerCommand("sol-exec.useContract", async (node: ContractTreeItem) => {
      useContract(node, abiTreeDataProvider, abiTreeView, pendingTransactionDataProvider, pendingTransactionTreeView, constructorTreeDataProvider, constructorTreeView);
    }),
    vscode.commands.registerCommand("sol-exec.refreshContracts", async (node: ContractTreeItem) => {
      contractTreeView = await refreshContract(node, contractTreeDataProvider);
    }),
    vscode.commands.registerCommand("sol-exec.deployContract", async (input: any) => {
      channel.appendLine(`Deploying contract ${STATE.currentContract} ...`);
      const contractAddress = await deployContract();
      if (contractAddress) {
        channel.appendLine(`Contract deployed at : ${contractAddress}`);
      } else {
        channel.appendLine(`Contract deployment failed.`);
      }
    }),
    vscode.commands.registerCommand("sol-exec.editContractAddress", async (input: any) => {
      editContractAddress(input);
      updateContractAddress(STATE.currentContract, abiTreeView, constructorTreeView, pendingTransactionTreeView);
    }),
    // constructor
    vscode.commands.registerCommand("sol-exec.editConstructorInput", async (input: any) => {
      editConstructorInput(input, constructorTreeDataProvider);
    }),
    // pending transaction 
    // under development
    vscode.commands.registerCommand("sol-exec.simulate", async (input: any) => {
      channel.appendLine(`Simulating transaction ...`);
    }),
    // under development
    vscode.commands.registerCommand("sol-exec.decode", async (input: any) => {
      channel.appendLine(`Decoding transaction ...`);
    }),
    // under development
    vscode.commands.registerCommand("sol-exec.edit", async (input: any) => {
      channel.appendLine(`Editing transaction ...`);
    }),
    // under development
    vscode.commands.registerCommand("sol-exec.send", async (input: any) => {
      channel.appendLine(`Sending transaction ...`);
    }),
    // under development
    vscode.commands.registerCommand("sol-exec.delete", async (input: any) => {
      channel.appendLine(`Deleting transaction ...`);
    }),
  );

  context.subscriptions.push(abiTreeView);
  context.subscriptions.push(contractTreeView as any);
  context.subscriptions.push(pendingTransactionTreeView);
  context.subscriptions.push(channel);

}

export function deactivate() { }
