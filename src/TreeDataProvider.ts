import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { newConnection, readABI } from './eth';

export class Web3TreeDataProvider implements vscode.TreeDataProvider<Contract> {
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
          console.log(file);
          const abi = await readABI(path.join(this.workspaceRoot, 'build/contracts', file));
          if (abi.length > 0) {
            leaves.push(new Contract(file, vscode.TreeItemCollapsibleState.None));
          }
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
}

class Contract extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = 'contract';
  }

//   get tooltip(): string {
//     return `${this.label}-${this.version}`;
//   }

//   get description(): string {
//     return this.version;
//   }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'Contract.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'Contract.svg')
  };
}