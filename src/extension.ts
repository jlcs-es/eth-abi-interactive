import * as vscode from 'vscode';
import { ContractTreeDataProvider, Contract } from './ContractTreeDataProvider';
import { AbiTreeDataProvider, Abi } from './AbiTreeDataProvider';
import { STATE } from './state';
import { callMethod, sendTransaction } from './eth';
import Web3 from 'web3';

function printResponse(channel: vscode.OutputChannel, result: any) {
	channel.appendLine(
		JSON.stringify(result, function(k, v){
			if (v instanceof Array) {
				return JSON.stringify(v);
			}
			return v;
		}, 2).replace(/\\/g, '')
		.replace(/\"\[/g, '[')
		.replace(/\]\"/g,']')
		.replace(/\"\{/g, '{')
		.replace(/\}\"/g,'}')
	);
}

export function activate(context: vscode.ExtensionContext) {
	const contractTreeDataProvider = new ContractTreeDataProvider(vscode.workspace.rootPath);
	const contractTreeView = vscode.window.createTreeView('eth-abi-interactive.contracts', {
		treeDataProvider: contractTreeDataProvider
	});
	context.subscriptions.push(contractTreeView);

	const abiTreeDataProvider = new AbiTreeDataProvider(vscode.workspace.rootPath);
	const abiTreeView = vscode.window.createTreeView('eth-abi-interactive.abis', {
		treeDataProvider: abiTreeDataProvider
	});
	abiTreeView.message = "Select a contract and its ABI functions will appear here.";
	context.subscriptions.push(abiTreeView);

	context.subscriptions.push(
		vscode.commands.registerCommand('eth-abi-interactive.setEndpoint', async () => {
			const value = await vscode.window.showInputBox({
				prompt: `Ethereun node endpoint URI`,
				value: STATE.endpoint
			});
			if (value) {
				STATE.endpoint = value;
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('eth-abi-interactive.setPrivateKey', async () => {
			const value = await vscode.window.showInputBox({
				prompt: `Private key of account (leave empty to autogenerate)`,
				value: STATE.privateKey
			});
			STATE.privateKey = value;
			if (STATE.privateKey) {
				STATE.account = STATE.web3.eth.accounts.privateKeyToAccount(STATE.privateKey);
				STATE.web3.eth.accounts.wallet.add(STATE.account);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('eth-abi-interactive.refreshEntry', () =>
			contractTreeDataProvider.refresh()
		)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('eth-abi-interactive.useContract', async (node: Contract) => {
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
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('eth-abi-interactive.editInput', async (input: Abi) => {
			const value = await vscode.window.showInputBox({
				prompt: `${input.abi.name}: ${input.abi.type}`
			});
			input.value = value;
			input.description = `${input.abi.type}: ${value}`;
			abiTreeDataProvider.refresh(input);
		})
	);

	const channel = vscode.window.createOutputChannel("Eth ABI Interactive");
	context.subscriptions.push(channel);

	context.subscriptions.push(
		vscode.commands.registerCommand('eth-abi-interactive.sendTransaction', async (func: Abi) => {
			const params = [];
			const paramsDesc = [];
			for (const input of func.abi.inputs) {
				paramsDesc.push(`${input.type} as ${input.type} ${input.name}`);
				params.push(JSON.parse(input.value));
			}
			channel.appendLine("####################################################################################");
			channel.appendLine(`Sending transaction ${func.abi.name}(${paramsDesc.join(", ")}) ...`);
			channel.show(true);
			const receipt = await sendTransaction(func.abi.name, ...params);
			printResponse(channel, receipt);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('eth-abi-interactive.callMethod', async (func: Abi) => {
			const params = [];
			const paramsDesc = [];
			for (const input of func.children) {
				paramsDesc.push(`${input.abi.type} ${input.abi.name} = ${input.value}`);
				params.push(input.value);
			}
			channel.appendLine("####################################################################################");
			channel.appendLine(`Calling method ${func.abi.name}(${paramsDesc.join(", ")}) ...`);
			channel.show(true);
			const result = await callMethod(func.abi.name, ...params);
			printResponse(channel, result);
		})
	);

}

export function deactivate() {}
