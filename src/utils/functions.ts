import * as fs from "fs";
import path from "path";
import { window, workspace } from "vscode";

export const getSourceName = (contractTitle: string) => {
  if (workspace.workspaceFolders === undefined) {
    window.showErrorMessage("please open solidity project to work");
    return;
  }

  const path_ = workspace.workspaceFolders[0].uri.fsPath;
  if (fs.existsSync(path.join(path_, "cache", "solidity-files-cache.json"))) {
    const file = JSON.parse(
      JSON.stringify(
        fs.readFileSync(
          path.join(path_, "cache", "solidity-files-cache.json"),
          { encoding: "utf-8" }
        )
      )
    );
    const data = JSON.parse(file);
    const filePathArray: any = Object.values(data.files).filter(
      (data: any) => data.artifacts[0] === contractTitle
    );

    const sourceName: string = filePathArray[0].sourceName;

    return fs.existsSync(
      path.join(
        path_,
        "artifacts",
        sourceName,
        `${contractTitle}_deployed_address.json`
      )
    );
  } else {
    window.showErrorMessage("No Hardhat cache file present.");
  }
};
