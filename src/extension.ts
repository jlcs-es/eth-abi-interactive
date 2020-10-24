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

	const disposable1 = vscode.commands.registerCommand('eth-abi-interactive.refreshEntry', () =>
		contractTreeDataProvider.refresh()
	);
	const disposable2 = vscode.commands.registerCommand('eth-abi-interactive.useContract', (node: Contract) => {
			STATE.currentContract = node.label;
			abiTreeDataProvider.refresh();
			abiTreeView.description = node.label;
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

	context.subscriptions.push(contractTreeView);
	context.subscriptions.push(abiTreeView);
	context.subscriptions.push(disposable1);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
}

export function deactivate() {}
