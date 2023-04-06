import * as vscode from "vscode";
import { STATE } from "../state";

let ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;

export class Constructor extends vscode.TreeItem {
  contextValue: string;
  constructor(
    public readonly label: string,
    public readonly value: any,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = "constructor";
    this.description = value.type + " : " + value.value;
  }

  command = {
    title: "Edit Value",
    command: "eth-abi-interactive.editConstructorInput",
    arguments: [this],
  };

  iconPath = new vscode.ThemeIcon("symbol-method");
}

export class ConstructorTreeDataProvider implements vscode.TreeDataProvider<Constructor> {
  constructor(private workspaceRoot: string | undefined) {}

  getTreeItem(element: Constructor): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Constructor): Promise<Constructor[]> {
    const leaves: Constructor[] = [];
    let constructorInputsEthcode: any;
    try {
        constructorInputsEthcode = await api.contract.getConstructorInput(STATE.currentContract);
    } catch (error) {
        console.log(error);
        return leaves;
    }
    console.log("============== constructorInputsEthcode ==============");
    console.log(constructorInputsEthcode);
    if (!element) {
        for (const entry of constructorInputsEthcode) {
            console.log("============== entry types ==============");
            console.log(entry.type);
            leaves.push(
                new Constructor(
                    entry.name,
                    entry,
                    vscode.TreeItemCollapsibleState.None
                )
            );
        }
    }
    return leaves;

  }

  private _onDidChangeTreeData: vscode.EventEmitter<Constructor | undefined> =
    new vscode.EventEmitter<Constructor | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Constructor | undefined> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}