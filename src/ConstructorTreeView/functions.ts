import { STATE } from "../state";
import { Constructor } from "./ConstructorTreeDataProvider";
import * as vscode from "vscode";
import * as fs from "fs";
import { Contract, Wallet } from "ethers";

let ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
const api: any = ethcodeExtension.exports;

async function search(filePath: string, searchString: string, startLine: number = 0) {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const start = text.indexOf(searchString, document.offsetAt(new vscode.Position(startLine, 0)));
    const startPosition = document.positionAt(start);
    return startPosition;
}

const editConstructorInput = async (input: Constructor, constructorTreeDataProvider: any) => {
    let filePath = "";
    let path = await vscode.workspace.findFiles(`**/${STATE.currentContract}_constructor_input.json`);
    filePath = path[0].fsPath;
    console.log(filePath);

    const document = await vscode.workspace.openTextDocument(filePath);

    console.log(input);

    let lineNumber = await search(filePath, `"name": "${input.label}"`);
    console.log(lineNumber, `"name": "${input.label}"`);
    let line = await search(filePath, `"name": "${input.label}"`, lineNumber.line);
    console.log(line, `"name": "${input.label}"`);

    const cursorPosition = new vscode.Position(line.line + 2, line.character + 10);
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(cursorPosition, cursorPosition);
    editor.revealRange(new vscode.Range(cursorPosition, cursorPosition));

    constructorTreeDataProvider.refresh(input);
};

export {
    editConstructorInput
};