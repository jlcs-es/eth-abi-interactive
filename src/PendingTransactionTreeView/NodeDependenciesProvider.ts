

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { read } from './functions';


function readJson() {
  return read();
}

class FunctionName extends vscode.TreeItem {
  contextValue: string;
  constructor(
    public functionName: string,
    public childern: Transaction[] | null
  ) {
    super(functionName, vscode.TreeItemCollapsibleState.Collapsed);
    this.functionName = functionName;
    this.childern = childern;
    this.contextValue = "FunctionName";
    this.iconPath = new vscode.ThemeIcon("symbol-method");
  }
}

class Transaction extends vscode.TreeItem {
  contextValue: string;
  constructor(
    public transactionName: string,
    public path: string | null,
    public parent: FunctionName | SubClass,
    public childern: SubClass[] | null,
    public context: string
  ) {
    super(
      transactionName, 
      (context === "Transaction" ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
    );
    this.transactionName = transactionName;
    this.path = path;
    this.parent = parent;
    this.childern = childern;
    this.contextValue = context;
  }
}
class SubClass extends vscode.TreeItem {
  constructor(
    public subClassName: string,
    public parent: Transaction,
    public childern: Transaction[] | null
  ) {
    super(subClassName, vscode.TreeItemCollapsibleState.Collapsed);
    this.subClassName = subClassName;
    this.parent = parent;
    this.childern = childern;
  }
}

async function createTreeView() {
  const treeData = await readJson();
  if (treeData === undefined) {
    return [];
  }
  var treeViewArray: Array<FunctionName> = [];
  if (Object.keys(treeData).length > 0 && typeof Object.keys(treeData) === 'object' && Object.keys(treeData) !== null) {
    Object.keys(treeData).map((functionName: any) => {
      var functionObject = new FunctionName(functionName, []);
      for (const transactionName in treeData[functionName]) {
        var transactionObject = new Transaction(transactionName, treeData[functionName][transactionName].path, functionObject, [], "Transaction");
        var decodedTransactionObject = new SubClass("Decoded", transactionObject, []);
        var simulatedTransactionObject = new SubClass("Simulated", transactionObject, []);
        for (const decodedTransactionName in treeData[functionName][transactionName].decoded) {
          var decodedObject = new Transaction(decodedTransactionName, treeData[functionName][transactionName].decoded[decodedTransactionName].path, decodedTransactionObject, null, "DecodedTransaction");
          decodedTransactionObject.childern?.push(decodedObject);
        }
        for (const simulatedTransactionName in treeData[functionName][transactionName].simulated) {
          var simulatedObject = new Transaction(simulatedTransactionName, treeData[functionName][transactionName].simulated[simulatedTransactionName].path, simulatedTransactionObject, null, "SimulatedTransaction");
          simulatedTransactionObject.childern?.push(simulatedObject);
        }
        transactionObject.childern?.push(simulatedTransactionObject);
        transactionObject.childern?.push(decodedTransactionObject);
        functionObject.childern?.push(transactionObject);
      }
      treeViewArray.push(functionObject);
    });
  }
  return treeViewArray;
}

export class PendingTransactionTreeDataProvider implements vscode.TreeDataProvider<FunctionName> {
  private _onDidChangeTreeData: vscode.EventEmitter<FunctionName | undefined | null> = new vscode.EventEmitter<FunctionName | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<FunctionName | undefined | null> = this._onDidChangeTreeData.event;

  public leaves: FunctionName[] | Transaction[] = [];

  getTreeItem(element: FunctionName): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FunctionName): Promise<any> {
    if (element) {
      return element.childern;
    } else {
      const leaves = await createTreeView();
      return leaves;
    }
  }

  async refresh(): Promise<void> {
    this._onDidChangeTreeData.fire(undefined);
    // this.leaves = await createTreeView();
    return;
  }
}



