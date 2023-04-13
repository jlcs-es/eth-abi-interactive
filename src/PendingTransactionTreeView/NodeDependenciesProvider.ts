import * as vscode from 'vscode';

export class PendingTransactionTreeDataProvider implements vscode.TreeDataProvider<PendingTransaction> {

  onDidChangeTreeData?: vscode.Event<void | PendingTransaction | PendingTransaction[] | null | undefined> | undefined;

  getTreeItem(element: PendingTransaction): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: PendingTransaction): Promise<PendingTransaction[]> {
    const pendingTransactions: PendingTransaction[] = [];
    pendingTransactions.push(new PendingTransaction("Pending Transaction 1"));
    pendingTransactions.push(new PendingTransaction("Pending Transaction 2"));
    pendingTransactions.push(new PendingTransaction("Pending Transaction 3"));
    return pendingTransactions;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<PendingTransaction | undefined> = new vscode.EventEmitter<PendingTransaction | undefined>();
  // readonly onDidChangeTreeData: vscode.Event<PendingTransaction | undefined> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}

export class PendingTransaction extends vscode.TreeItem {
  contextValue: string;
  constructor(
    public readonly label: string
  ) {
    super(label);
    this.contextValue = "pendingTransaction";
  }

  command = {
    title: "Select pending transacion",
    command: "sol-exec.selectPendingTransaction",
    arguments: [this],
  };

  iconPath = new vscode.ThemeIcon("symbol-misc");
}

