import { STATE } from "../state";
import { Constructor } from "./ConstructorTreeDataProvider";
import * as vscode from "vscode";
import * as fs from "fs";
import { Contract, Wallet } from "ethers";

const ethcodeExtension: any = vscode.extensions.getExtension("7finney.ethcode");
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
    const path = await vscode.workspace.findFiles(`**/${STATE.currentContract}_constructor_input.json`);
    filePath = path[0].fsPath;
    const document = await vscode.workspace.openTextDocument(filePath);
    const lineNumber = await search(filePath, `"name": "${input.label}"`);
    const line = await search(filePath, `"name": "${input.label}"`, lineNumber.line);
    const cursorPosition = new vscode.Position(line.line + 2, line.character + 10);
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(cursorPosition, cursorPosition);
    editor.revealRange(new vscode.Range(cursorPosition, cursorPosition));
    constructorTreeDataProvider.refresh(input);
};

export {
    editConstructorInput
};