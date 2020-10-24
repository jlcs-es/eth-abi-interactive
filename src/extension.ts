import * as vscode from 'vscode';
import { ContractTreeDataProvider, Contract } from './ContractTreeDataProvider';
import { AbiTreeDataProvider, Abi } from './AbiTreeDataProvider';
import { STATE } from './state';

export function activate(context: vscode.ExtensionContext) {
	const contractTreeDataProvider = new ContractTreeDataProvider(vscode.workspace.rootPath);
	const contractTreeView = vscode.window.createTreeView('eth-abi-interactive.contracts', {
		treeDataProvider: contractTreeDataProvider
	});

	const abiTreeDataProvider = new AbiTreeDataProvider(vscode.workspace.rootPath);
	const abiTreeView = vscode.window.createTreeView('eth-abi-interactive.abis', {
		treeDataProvider: abiTreeDataProvider
	});
	abiTreeView.message = "Select a contract and its ABI functions will appear here.";


	const disposable0 = vscode.commands.registerCommand('eth-abi-interactive.setEndpoint', async () => {
		const value = await vscode.window.showInputBox({
			prompt: `Ethereun node endpoint URI`,
			value: STATE.endpoint
		});
		if (value) {
			STATE.endpoint = value;
		}
	});
	const disposable1 = vscode.commands.registerCommand('eth-abi-interactive.refreshEntry', () =>
		contractTreeDataProvider.refresh()
	);
	const disposable2 = vscode.commands.registerCommand('eth-abi-interactive.useContract', async (node: Contract) => {
		const address = await vscode.window.showInputBox({
			prompt: `Deployed contract address`
		});
		if (!address) {
			return;
		}
		STATE.currentContract = node.label;
		STATE.contractAddress = address;
		abiTreeDataProvider.refresh();
		abiTreeView.description = `${node.label} @ ${address}`;
		abiTreeView.message = undefined;
	});

	const disposable3 = vscode.commands.registerCommand('eth-abi-interactive.editInput', async (input: Abi) => {
		const value = await vscode.window.showInputBox({
			prompt: `${input.abi.name}: ${input.abi.type}`
		});
		input.value = value;
		input.description = `${input.abi.type}: ${value}`;
		abiTreeDataProvider.refresh(input);
	});

	const channel = vscode.window.createOutputChannel("Eth ABI Interactive");

	const disposable4 = vscode.commands.registerCommand('eth-abi-interactive.sendTransaction', async (func: Abi) => {
		let params = [];
		for (const input of func.abi.inputs) {
			params.push(`${input.type} ${input.name}`);
		}
		channel.appendLine("####################################################################################");
		channel.appendLine(`Sending transaction ${func.abi.name}(${params.join(", ")}) ...`);
		channel.appendLine(JSON.stringify(func.abi, undefined, 4));
		channel.show(true);
	});

	context.subscriptions.push(contractTreeView);
	context.subscriptions.push(abiTreeView);
	context.subscriptions.push(disposable0);
	context.subscriptions.push(disposable1);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
	context.subscriptions.push(disposable4);
	context.subscriptions.push(channel);
}

export function deactivate() {}
