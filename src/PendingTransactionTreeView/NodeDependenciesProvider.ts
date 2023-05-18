// import * as vscode from 'vscode';
// // import { PendingTransaction } from './PendingTransactionItems';
// import {
//   FunctionName,
//   TransactionID,
//   DecodedTransaction,
//   DecodedTransactionID,
//   SimulatedTransaction,
//   SimulatedTransactionID,

// }
//   from './PendingTransactionItems';

// import * as fs from 'fs';
// import * as path from 'path';

// export class PendingTransactionTreeDataProvider implements vscode.TreeDataProvider<FunctionName> {

//   onDidChangeTreeData?: vscode.Event<void | FunctionName | FunctionName[] | null | undefined> | undefined;

//   getTreeItem(element: FunctionName): vscode.TreeItem {
//     return element;
//   }


//   async getDecodedTransactionIDTreeView(element: any): Promise<DecodedTransaction> {
//     console.log('-------------------------------------------------getDecodedTransactionIDTreeView-------------------------------------------------');
//     console.log(element);
//     var decodedTransaction: DecodedTransaction = new DecodedTransaction(
//       "Decoded",
//       element,
//       [],
//       vscode.TreeItemCollapsibleState.Collapsed,
//     );
//     return decodedTransaction;
//   }

//   async getSimpulatedTransactionIDTreeView(element: any): Promise<SimulatedTransaction> {
//     console.log('-------------------------------------------------getDecodedTransactionIDTreeView-------------------------------------------------');
//     console.log(element);
//     var simulatedTransaction: SimulatedTransaction = new SimulatedTransaction(
//       "Simulated",
//       element,
//       [],
//       vscode.TreeItemCollapsibleState.Collapsed,
//     );
//     return simulatedTransaction;
//   }

//   async getTransactionIDTreeView(element: any): Promise<TransactionID[]> {
//     console.log('-------------------------------------------------getTransactionIDTreeItem-------------------------------------------------');
//     console.log(element);
//     var transactionIDs: TransactionID[] = [];
//     for (const transactionID in element) {
//       console.log('-------------------------------------------------transactionID-------------------------------------------------');
//       console.log(transactionID);
//       var decodedTransaction: DecodedTransaction = await this.getDecodedTransactionIDTreeView(element[transactionID]);
//       var simulatedTransaction: SimulatedTransaction = await this.getSimpulatedTransactionIDTreeView(element[transactionID]);

//       transactionIDs.push(
//         new TransactionID(
//           transactionID,
//           element[transactionID].path,
//           element,
//           [decodedTransaction, simulatedTransaction],
//           vscode.TreeItemCollapsibleState.None,
//         )
//       );
//     }
//     return transactionIDs;
//   }

//   async generatePendingTransactionTreeView(): Promise<FunctionName[]> {
//     console.log('-------------------------------------------------generatePendingTransactionTreeView-------------------------------------------------');
//     var pendingTransactions: FunctionName[] = [];
//     const basePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
//     if (basePath === undefined) {
//       throw new Error("No workspace folder found");
//     }
//     const readTransactionPath = `${path.join(basePath, `artifacts\\sol-exec\\readTransaction.json`)}`;
//     const readTransaction = fs.readFileSync(readTransactionPath);
//     const data = JSON.parse(readTransaction.toString());
//     console.log('-------------------------------------------------data-------------------------------------------------');
//     console.log(data);
//     for (const functionName in data) {
//       console.log('-------------------------------------------------functionName-------------------------------------------------');
//       console.log(functionName);
//       var transacionIDs: TransactionID[] = await this.getTransactionIDTreeView(data[functionName]);
//       pendingTransactions.push(
//         new FunctionName(
//           functionName,
//           null,
//           transacionIDs,
//           vscode.TreeItemCollapsibleState.Collapsed,
//         )
//       );
//     }
//     console.log('-------------------------------------------------pendingTransactions-------------------------------------------------');
//     console.log(pendingTransactions);
//     return pendingTransactions;
//   }

//   async getChildren(element?: FunctionName): Promise<FunctionName[]> {
//     console.log('-------------------------------------------------getChildren-------------------------------------------------');
//     const pendingTransactions: FunctionName[] | undefined = await this.generatePendingTransactionTreeView();
//     return pendingTransactions;
//   }

//   private _onDidChangeTreeData: vscode.EventEmitter<FunctionName | undefined> = new vscode.EventEmitter<FunctionName | undefined>();
//   // readonly onDidChangeTreeData: vscode.Event<FunctionName | undefined> = this._onDidChangeTreeData.event;
//   refresh(item?: FunctionName): void {
//     this._onDidChangeTreeData.fire(item);
//     console.log("refreshed tree view");
//   }
// }


import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { read } from './functions';

class FunctionName extends vscode.TreeItem {
  contextValue: string;
  constructor(
    public readonly label: string,
    public readonly children: vscode.TreeItem[] | null,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = "FunctionName";
    this.iconPath = new vscode.ThemeIcon("symbol-parameter");
  }
}

export class PendingTransactionTreeDataProvider implements vscode.TreeDataProvider<FunctionName> {
  private transactions: any = {};
  private onDidChangeTreeDataEmitter: vscode.EventEmitter<FunctionName | undefined> = new vscode.EventEmitter<FunctionName | undefined>();
  readonly onDidChangeTreeData: vscode.Event<FunctionName | undefined> = this.onDidChangeTreeDataEmitter.event;
  public pendingTransactions: FunctionName[] = [];
  constructor() {
    this.loadTransactions();
  }

  private async loadTransactions() {
    this.transactions = await read();
  }

  refresh(): void {
    this.loadTransactions();
    this.onDidChangeTreeDataEmitter.fire(undefined);
  }

  getTreeItem(element: FunctionName): FunctionName {
    return element;
  }

  getChildren(element?: FunctionName): FunctionName[] {
    console.log('-------------------------------------------------getChildren-------------------------------------------------');
    console.log(element);

    for (const functionName in this.transactions) {
      console.log('-------------------------------------------------functionName-------------------------------------------------');
      console.log(functionName);
      for (const transactionID in this.transactions[functionName]) {
        console.log('-------------------------------------------------transactionID-------------------------------------------------');
        console.log(transactionID);
        console.log(this.transactions[functionName][transactionID].path);
        for (const decodedTransaction in this.transactions[functionName][transactionID].decoded) {
          console.log('-------------------------------------------------decodedTransaction-------------------------------------------------');
          console.log(decodedTransaction);
          console.log(this.transactions[functionName][transactionID].decoded[decodedTransaction].path);
        }
        for (const simulatedTransaction in this.transactions[functionName][transactionID].simulated) {
          console.log('-------------------------------------------------simulatedTransaction-------------------------------------------------');
          console.log(simulatedTransaction);
          console.log(this.transactions[functionName][transactionID].simulated[simulatedTransaction].path);
        }
      }
      // create a new function name
      var functionNameTreeElement: FunctionName = new FunctionName(
        functionName,
        [
          new vscode.TreeItem(
            "TransactionID",
            vscode.TreeItemCollapsibleState.None,
          ),
        ],
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      // push the function name to the pending transactions
      this.pendingTransactions.push(functionNameTreeElement);
    }
    console.log('-------------------------------------------------pendingTransactions-------------------------------------------------');
    console.log(this.pendingTransactions);
    return this.pendingTransactions;
  }
}




