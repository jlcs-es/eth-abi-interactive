import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STATE } from './state';

let ethcodeExtension: any = vscode.extensions.getExtension('7finney.ethcode');
const api: any = ethcodeExtension.exports;


export class ContractTreeDataProvider implements vscode.TreeDataProvider<Contract> {
  constructor(private workspaceRoot: string | undefined) {}

  getTreeItem(element: Contract): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Contract): Promise<Contract[]> {

    let contracts:string[] = await api.contract.list();

    if (contracts.length > 0) {
      const leaves = [];
      for (const file of contracts) {
        leaves.push(new Contract(file, vscode.TreeItemCollapsibleState.None));
      }
      return leaves;
    }
    else{
      vscode.window.showInformationMessage('No Contracts found');
      return [];
    }
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Contract | undefined> = new vscode.EventEmitter<Contract | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Contract | undefined> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}

export class Contract extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = 'contract';
  }

  command = {
    title: "Use Contract",
    command: "eth-abi-interactive.useContract",
    arguments: [this]
  };

  iconPath = new vscode.ThemeIcon("file-code");
}