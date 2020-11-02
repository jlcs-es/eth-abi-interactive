import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STATE } from './state';

export class AccountTreeDataProvider implements vscode.TreeDataProvider<Account> {
  constructor(private workspaceRoot: string | undefined) {}

  getTreeItem(element: Account): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Account): Promise<Account[]> {
    if(element) {
      return [];
    }
    const keys = STATE.privateKeys;
    const children = [];
    for(const key of keys) {
      children.push(new Account(key.alias, key, vscode.TreeItemCollapsibleState.None));
    }
    return children;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Account | undefined> = new vscode.EventEmitter<Account | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Account | undefined> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}

export class Account extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public key: any,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = 'account';
    this.tooltip = 'Click to use this account';
  }

  command = {
    title: "Use account",
    command: "eth-abi-interactive.useAccount",
    arguments: [this]
  };

  iconPath = new vscode.ThemeIcon("key");
}