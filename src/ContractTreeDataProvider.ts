import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { newConnection, readABI } from './eth';

export class ContractTreeDataProvider implements vscode.TreeDataProvider<Contract> {
  constructor(private workspaceRoot: string | undefined) {}

  getTreeItem(element: Contract): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Contract): Promise<Contract[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No Contracts in empty workspace');
      return [];
    }

    if (!element) {
      const dir = path.join(this.workspaceRoot, 'build/contracts');
      if (fs.existsSync(dir)) {
        const files = await fs.promises.readdir(dir);
        const leaves = [];
        for (const file of files) {
          leaves.push(new Contract(file, vscode.TreeItemCollapsibleState.None));
        }
        return leaves;
      }
    }

    return [];
    // if (element) {
    //     return this.getDepsInPackageJson(
    //       path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')
    //     );
    // } else {
    //   const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
    //   if (this.pathExists(packageJsonPath)) {
    //     return this.getDepsInPackageJson(packageJsonPath);
    //   } else {
    //     vscode.window.showInformationMessage('Workspace has no package.json');
    //     return [];
    //   }
    // }
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonPath: string): Contract[] {
    if (this.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const toDep = (moduleName: string, version: string): Contract => {
        if (this.pathExists(path.join(this.workspaceRoot || '', 'node_modules', moduleName))) {
          return new Contract(
            moduleName,
            vscode.TreeItemCollapsibleState.Collapsed
          );
        } else {
          return new Contract(moduleName, vscode.TreeItemCollapsibleState.None);
        }
      };

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map(dep =>
            toDep(dep, packageJson.dependencies[dep])
          )
        : [];
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map(dep =>
            toDep(dep, packageJson.devDependencies[dep])
          )
        : [];
      return deps.concat(devDeps);
    } else {
      return [];
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
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