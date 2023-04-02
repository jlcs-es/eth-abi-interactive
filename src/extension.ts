import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { ContractTreeDataProvider, Contract } from "./ContractTreeDataProvider";
import { AbiTreeDataProvider, Abi } from "./AbiTreeDataProvider";
import { STATE } from "./state";
import { PendingTransactionTreeDataProvider } from "./NodeDependenciesProvider";
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import { myEmitter } from "./NodeDependenciesProvider";
import { getSourceName } from "./utils/functions";

const settings = {
  apiKey: "2BfT7PmhS5UzBkXbguSIXm5Nk3myk0ey",
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);

let ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;

export async function activate(context: vscode.ExtensionContext) {
  const path_ = vscode.workspace.workspaceFolders;
  if (path_ === undefined) {
    vscode.window.showErrorMessage("No folder selected please open one.");
    return;
  }

  const contractTreeDataProvider = new ContractTreeDataProvider(
    vscode.workspace.rootPath
  );
  let contractTreeView = vscode.window.createTreeView(
    "eth-abi-interactive.contracts",
    {
      treeDataProvider: contractTreeDataProvider,
    }
  );
  api.events.contracts.event(() => {
    contractTreeView = vscode.window.createTreeView(
      "eth-abi-interactive.contracts",
      {
        treeDataProvider: contractTreeDataProvider,
      }
    );
  });
  context.subscriptions.push(contractTreeView as any);

  const abiTreeDataProvider = new AbiTreeDataProvider(
    vscode.workspace.rootPath
  );
  const abiTreeView = vscode.window.createTreeView("eth-abi-interactive.abis", {
    treeDataProvider: abiTreeDataProvider,
  });
  abiTreeView.message =
    "Select a contract and its ABI functions will appear here.";
  context.subscriptions.push(abiTreeView);
	
  context.subscriptions.push(
		vscode.commands.registerCommand('eth-abi-interactive.editInput', async (input: Abi) => {
      // get path of the file
      let filePath = "";
      let path = await vscode.workspace.findFiles(`**/${STATE.currentContract}_functions_input.json`);
      filePath = path[0].fsPath;
      console.log(filePath);
			const value = await vscode.window.showInputBox({
				prompt: `${input.abi.name}: ${input.abi.type}`
			});
      if(!value) {return;}
			input.value = value;
			input.description = `${input.abi.type}: ${value}`;
      let data  = fs.readFileSync(filePath);
      let json = JSON.parse(data.toString());
      json.find((item: any) => item.name === input.parent?.abi.name).inputs.find((item: any) => item.name === input.abi.name).value = value;
      let newData = JSON.stringify(json, null, 2);
      fs.writeFileSync(filePath, newData);
      abiTreeDataProvider.refresh(input);
		})
	);
  
  fs.watch(path_[0].uri.fsPath,{ recursive: true }, (eventType, filename) => {
    console.log(`File ${filename} has been ${eventType}`);
    abiTreeDataProvider.refresh();
  });

  context.subscriptions.push(
		vscode.commands.registerCommand('eth-abi-interactive.sendTransaction', async (func: Abi) => {
			channel.appendLine("####################################################################################");
			channel.appendLine(`Sending transaction ${func.abi.name} ...`);
      console.log(func);
			channel.show(true);
		})
	);

  const pendingTransactionDataProvider =
    new PendingTransactionTreeDataProvider();

  const pendingTransactionTreeView = vscode.window.createTreeView(
    "eth-abi-interactive.pendingTxn",
    {
      treeDataProvider: pendingTransactionDataProvider,
    }
  );
  pendingTransactionTreeView.message =
    "Select a contract and its pending transaction will appear here.";
  context.subscriptions.push(pendingTransactionTreeView);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eth-abi-interactive.setEndpoint",
      async () => {
        vscode.window.showInformationMessage(
          api.status || "No ethcode extension found"
        );
        const value = await vscode.window.showInputBox({
          prompt: `Ethereun node endpoint URI`,
          value: STATE.endpoint,
        });
        if (value) {
          STATE.endpoint = value;
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eth-abi-interactive.useContract",
      async (node: Contract) => {
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
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eth-abi-interactive.refreshContracts",
      async (node: Contract) => {
        contractTreeView = vscode.window.createTreeView(
          "eth-abi-interactive.contracts",
          {
            treeDataProvider: contractTreeDataProvider,
          }
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eth-abi-interactive.refreshTreeView",
      () => {
        pendingTransactionDataProvider.refresh();
        alchemy.ws.removeAllListeners();
      }
    )
  );

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

  const channel = vscode.window.createOutputChannel("Eth ABI Interactive");
  context.subscriptions.push(channel);
}

export function deactivate() {}
