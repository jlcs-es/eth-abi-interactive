import * as vscode from "vscode";
import * as fs from "fs";
import { ContractTreeDataProvider, Contract as ContractTreeItem } from "./ContractTreeView/ContractTreeDataProvider";
import { AbiTreeDataProvider, Abi } from "./AbiTreeView/AbiTreeDataProvider";
import { STATE } from "./state";
import { PendingTransactionTreeDataProvider } from "./PendingTransactionTreeView/NodeDependenciesProvider";
// import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import { getSourceName } from "./utils/functions";
import { Contract, ContractFactory, Wallet } from "ethers";
import { callContract, editInput, sendTransaction } from "./AbiTreeView/functions";
import { deployContract, editContractAddress, refreshContract, updateContractAddress, useContract } from "./ContractTreeView/functions";
import { ConstructorTreeDataProvider } from "./ConstructorTreeView/ConstructorTreeDataProvider";
import { editConstructorInput } from "./ConstructorTreeView/functions";

// const settings = {
//   apiKey: "2BfT7PmhS5UzBkXbguSIXm5Nk3myk0ey",
//   network: Network.ETH_MAINNET,
// };

// const alchemy = new Alchemy(settings);

const ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;

export async function activate(context: vscode.ExtensionContext) {
  const path_ = vscode.workspace.workspaceFolders;

  if (path_ === undefined) {
    vscode.window.showErrorMessage("No folder selected please open one.");
    return;
  }

  const channel = vscode.window.createOutputChannel("Eth ABI Interactive");

  // Contract Tree View
  const contractTreeDataProvider = new ContractTreeDataProvider(
    vscode.workspace.rootPath
  );

  let contractTreeView = vscode.window.createTreeView("eth-abi-interactive.contracts", {
    treeDataProvider: contractTreeDataProvider,
  });

  api.events.contracts.event(() => {
    contractTreeView = vscode.window.createTreeView("eth-abi-interactive.contracts", {
      treeDataProvider: contractTreeDataProvider,
    });
  });

  // Abi Tree View
  const abiTreeDataProvider = new AbiTreeDataProvider(
    vscode.workspace.rootPath
  );
  const abiTreeView = vscode.window.createTreeView("eth-abi-interactive.abis", {
    treeDataProvider: abiTreeDataProvider,
  });

  abiTreeView.message = "Select a contract and its ABI functions will appear here.";



  // constructor tree view
  const constructorTreeDataProvider = new ConstructorTreeDataProvider(
    vscode.workspace.rootPath
  );

  const constructorTreeView = vscode.window.createTreeView("eth-abi-interactive.constructor", {
    treeDataProvider: constructorTreeDataProvider,
  });

  constructorTreeView.message = "Select a contract and its constructor will appear here.";

  // pending transaction tree view
  const pendingTransactionDataProvider = new PendingTransactionTreeDataProvider();

  const pendingTransactionTreeView = vscode.window.createTreeView("eth-abi-interactive.pendingTxn", {
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
    vscode.commands.registerCommand('eth-abi-interactive.editInput', async (input: Abi) => {
      editInput(input, abiTreeDataProvider);
    }),
    vscode.commands.registerCommand('eth-abi-interactive.sendTransaction', async (func: Abi) => {
      sendTransaction(func, channel);
    }),
    vscode.commands.registerCommand('eth-abi-interactive.callContract', async (func: Abi) => {
      callContract(func, channel);
    }),
    // contract 
    vscode.commands.registerCommand("eth-abi-interactive.useContract", async (node: ContractTreeItem) => {
      useContract(node, abiTreeDataProvider, abiTreeView, pendingTransactionDataProvider, pendingTransactionTreeView, constructorTreeDataProvider, constructorTreeView);
    }),
    vscode.commands.registerCommand("eth-abi-interactive.refreshContracts", async (node: ContractTreeItem) => {
      contractTreeView = await refreshContract(node, contractTreeDataProvider);
    }),
    vscode.commands.registerCommand("eth-abi-interactive.deployContract", async (input: any) => {
      channel.appendLine(`Deploying contract ${STATE.currentContract} ...`);
      const contractAddress = await deployContract();
      if (contractAddress) {
        channel.appendLine(`Contract deployed at : ${contractAddress}`);
      } else {
        channel.appendLine(`Contract deployment failed.`);
      }
    }),
    vscode.commands.registerCommand("eth-abi-interactive.editContractAddress", async (input: any) => {
      editContractAddress(input);
      updateContractAddress(STATE.currentContract, abiTreeView, constructorTreeView, pendingTransactionTreeView);
    }),
    // constructor
    vscode.commands.registerCommand("eth-abi-interactive.editConstructorInput", async (input: any) => {
      editConstructorInput(input, constructorTreeDataProvider);
    }),
  );

  context.subscriptions.push(abiTreeView);
  context.subscriptions.push(contractTreeView as any);
  context.subscriptions.push(pendingTransactionTreeView);
  context.subscriptions.push(channel);


  // context.subscriptions.push(
  //   vscode.commands.registerCommand(
  //     "eth-abi-interactive.refreshTreeView",
  //     () => {
  //       pendingTransactionDataProvider.refresh();
  //       // alchemy.ws.removeAllListeners();
  //     }
  //   )
  // );

  // alchemy.ws.on(
  // 	{
  // 		method: AlchemySubscription.PENDING_TRANSACTIONS,
  // 		// toAddress: "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b",
  // 		toAddress: STATE.contractAddress,
  // 	},
  // 	(tx) => {
  // 		if (STATE.flag) {
  // 			console.log(tx);
  // 			let obj = {
  // 				label: tx.hash,
  // 				collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 				children: [
  // 					{
  // 						label: `from`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.from,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `gas`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.gas,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `gasPrice`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.gasPrice,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `maxFeePerGas`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.maxFeePerGas,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `maxPriorityFeePerGas`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.maxPriorityFeePerGas,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `hash`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.hash,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `input`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.input,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `nonce`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.nonce,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `to`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.to,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `value`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.value,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `type`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.type,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `v`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.v,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `r`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.r,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 					{
  // 						label: `s`,
  // 						collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  // 						children: [
  // 							{
  // 								label: tx.s,
  // 								collapsibleState: vscode.TreeItemCollapsibleState.None
  // 							}
  // 						]
  // 					},
  // 				]
  // 			};
  // 			console.log(obj);
  // 			myEmitter.emit('newPendingTransaction', obj);
  // 		}
  // 	}
  // );
  // myEmitter.on('newPendingTransaction', (arg) => {
  // 	pendingTransactionDataProvider.loadData(arg);
  // });

}

export function deactivate() { }
