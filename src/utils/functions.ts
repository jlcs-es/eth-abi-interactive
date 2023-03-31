import vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { window, workspace } from "vscode";

const CONTRACT_FILES = ["deployed_address.json", "functions_input.json"];

export const getSourceName = async (contractTitle: string) => {
  if (workspace.workspaceFolders === undefined) {
    window.showErrorMessage("open a project");
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
    const filePathArray: any = Object.values(data.files).filter((data: any) =>
      data.artifacts.includes(contractTitle)
    );

    const sourceName: string = filePathArray[0].sourceName;

    const result = await isAllFilesPresent(path_, sourceName, contractTitle);

    return result;
  } else {
    window.showErrorMessage("No Hardhat cache file present.");
  }
};

const isAllFilesPresent = async (
  path_: string,
  sourceName: string,
  contractTitle: string
) => {
  const isPresent = CONTRACT_FILES.map((fileFormat) => {
    const isFilePresent = fs.existsSync(
      path.join(
        path_,
        "artifacts",
        sourceName,
        `${contractTitle}_${fileFormat}`
      )
    );
    return isFilePresent;
  });

  const result = isPresent.filter((condition) => condition === false);
  return result[0];
};
