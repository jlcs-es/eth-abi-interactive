

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
    public path: string,
    public parent: FunctionName | SubClass,
    public childern: SubClass[] | null,
    public context: string
  ) {
    super(transactionName, vscode.TreeItemCollapsibleState.Collapsed);
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
  const treeView =await readJson();
  console.log('treeView ------>>>>', treeView);
  var treeViewArray: Array<FunctionName> = [];
  if(Object.keys(treeView).length > 0) {
    Object.keys(treeView).map((functionName) => {
      var functionObject = new FunctionName(functionName,[]);
      for (const transactionName in treeView[functionName]) {
          var transactionObject = new Transaction(transactionName,treeView[functionName][transactionName].path,functionObject,[],"Transaction");
          var decodedTransactionObject = new SubClass("Decoded",transactionObject,[]);
          var simulatedTransactionObject = new SubClass("Simulated",transactionObject,[]);
          for (const decodedTransactionName in treeView[functionName][transactionName].decoded) {
              var decodedObject = new Transaction(decodedTransactionName,treeView[functionName][transactionName].decoded[decodedTransactionName].path,decodedTransactionObject,null,"DecodedTransaction");
              decodedTransactionObject.childern?.push(decodedObject);
          }
          for (const simulatedTransactionName in treeView[functionName][transactionName].simulated) {
              var simulatedObject = new Transaction(simulatedTransactionName,treeView[functionName][transactionName].simulated[simulatedTransactionName].path,simulatedTransactionObject,null,"SimulatedTransaction");
              simulatedTransactionObject.childern?.push(simulatedObject);
          }
          transactionObject.childern?.push(simulatedTransactionObject);
          transactionObject.childern?.push(decodedTransactionObject);
          functionObject.childern?.push(transactionObject);
      }
      treeViewArray.push(functionObject);
    });
  }
  // for (const functionName in treeView) {
  //     var functionObject = new FunctionName(functionName,[]);
  //     for (const transactionName in treeView[functionName]) {
  //         var transactionObject = new Transaction(transactionName,treeView[functionName][transactionName].path,functionObject,[],"Transaction");
  //         var decodedTransactionObject = new SubClass("Decoded",transactionObject,[]);
  //         var simulatedTransactionObject = new SubClass("Simulated",transactionObject,[]);
  //         for (const decodedTransactionName in treeView[functionName][transactionName].decoded) {
  //             var decodedObject = new Transaction(decodedTransactionName,treeView[functionName][transactionName].decoded[decodedTransactionName].path,decodedTransactionObject,null,"DecodedTransaction");
  //             decodedTransactionObject.childern?.push(decodedObject);
  //         }
  //         for (const simulatedTransactionName in treeView[functionName][transactionName].simulated) {
  //             var simulatedObject = new Transaction(simulatedTransactionName,treeView[functionName][transactionName].simulated[simulatedTransactionName].path,simulatedTransactionObject,null,"SimulatedTransaction");
  //             simulatedTransactionObject.childern?.push(simulatedObject);
  //         }
  //         transactionObject.childern?.push(simulatedTransactionObject);
  //         transactionObject.childern?.push(decodedTransactionObject);
  //         functionObject.childern?.push(transactionObject);
  //     }
  //     treeViewArray.push(functionObject);
  // }
  return treeViewArray;
}

console.log(readJson());

console.log(createTreeView());

export class PendingTransactionTreeDataProvider implements vscode.TreeDataProvider<FunctionName> {
  private _onDidChangeTreeData: vscode.EventEmitter<FunctionName | undefined | null> = new vscode.EventEmitter<FunctionName | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<FunctionName | undefined | null> = this._onDidChangeTreeData.event;

  public leaves : FunctionName[] = [];
  getTreeItem(element: FunctionName): vscode.TreeItem {
      return element;
  }

  async getChildren(element?: FunctionName): Promise<FunctionName[]> {
      this.leaves = await createTreeView();
      console.log(this.leaves);
      return this.leaves;
  }

  async refresh(): Promise<void> {
      this._onDidChangeTreeData.fire(undefined);
      this.leaves = await createTreeView();
      console.log(this.leaves);
      return ;
  }
}



