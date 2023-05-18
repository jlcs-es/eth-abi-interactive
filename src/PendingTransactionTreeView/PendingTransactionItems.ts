import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { STATE } from '../state';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


// FunctionName    
//     TransactionID ( path )   
//         DecodedTransaction
//             DecodedTransactionID ( path )
//         SimulatedTransaction
//             SimulatedTransactionID ( path )

export class FunctionName extends TreeItem {
    contextValue: string;
    constructor(
        public readonly label: string,
        public parent: null,
        public readonly children: TransactionID[],
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.contextValue = "functionName";
        this.iconPath = new ThemeIcon("symbol-method");
    }
}

export class TransactionID extends TreeItem {
    contextValue: string;
    constructor(
        public readonly label: string,
        public readonly path: string,
        public parent: FunctionName,
        public readonly children: DecodedTransaction[] | SimulatedTransaction[],
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.contextValue = "transactionID";
        this.iconPath = new ThemeIcon("symbol-parameter");
    }

    command = {
        title: "Select transaction",
        command: "sol-exec.selectTransaction",
        arguments: [this],
    };
}

export class DecodedTransaction extends TreeItem {
    contextValue: string;
    constructor(
        public readonly label: string,
        public parent: TransactionID,
        public readonly children: DecodedTransactionID[],
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.contextValue = "decodedTransaction";
        this.iconPath = new ThemeIcon("symbol-method");
    }
}

export class DecodedTransactionID extends TreeItem {
    contextValue: string;
    constructor(
        public readonly label: string,
        public readonly path: string,
        public parent: DecodedTransaction,
        public readonly children: null,
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.contextValue = "decodedTransactionID";
        this.iconPath = new ThemeIcon("symbol-parameter");
    }

    command = {
        title: "Select decoded transaction",
        command: "sol-exec.selectDecodedTransaction",
        arguments: [this],
    };
}

export class SimulatedTransaction extends TreeItem {
    contextValue: string;
    constructor(
        public readonly label: string,
        public parent: TransactionID,
        public readonly children: SimulatedTransactionID[],
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.contextValue = "simulatedTransaction";
        this.iconPath = new ThemeIcon("symbol-method");
    }
}

export class SimulatedTransactionID extends TreeItem {
    contextValue: string;
    constructor(
        public readonly label: string,
        public parent: SimulatedTransaction,
        public readonly children: null,
        public readonly path: string,
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.contextValue = "simulatedTransactionID";
        this.iconPath = new ThemeIcon("symbol-parameter");
    }

    command = {
        title: "Select simulated transaction",
        command: "sol-exec.selectSimulatedTransaction",
        arguments: [this],
    };
}


export class PendingTransaction extends TreeItem {
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

    iconPath = new ThemeIcon("symbol-misc");
}


export class Element extends TreeItem {
    contextValue?: string ;
    constructor(
        public readonly label: string,
        public readonly type: string,
        public readonly path: string,
        public readonly children: Element[] | null,
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.contextValue = type;
    }

    command = {
        title: "Select element",
        command: "sol-exec.selectElement",
        arguments: [this],
    };
    iconPath = new ThemeIcon("symbol-misc");
}