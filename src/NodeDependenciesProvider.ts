import * as vscode from 'vscode';
import EventEmitter from 'events';
class MyEmitter extends EventEmitter {}

export const myEmitter = new MyEmitter();

interface TreeItemData {
  label: string;
  collapsibleState: vscode.TreeItemCollapsibleState;
  children?: TreeItemData[];
}


export class PendingTransactionTreeDataProvider implements vscode.TreeDataProvider<TreeItemData> {

  private _onDidChangeTreeData: vscode.EventEmitter<TreeItemData | undefined> = new vscode.EventEmitter<TreeItemData | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItemData | undefined> = this._onDidChangeTreeData.event;

  private treeData: TreeItemData[] = [];

  getTreeItem(element: TreeItemData): vscode.TreeItem {
    return {
      label: element.label,
      collapsibleState: element.collapsibleState
    };
  }

  getChildren(element?: TreeItemData): Thenable<TreeItemData[]> {
    if (!element) {
      return Promise.resolve(this.treeData);
    }
    return Promise.resolve(element.children || []);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  loadData(obj: TreeItemData): void {
    this.treeData.push(obj);
    this.refresh(); // refresh the tree view after loading data
  }

}
