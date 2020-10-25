import Web3 from 'web3';
import * as fs from 'fs';
import { STATE } from './state';

export function reconnect() {
    STATE.web3 = new Web3(STATE.endpoint);
}

export async function readABI(path: string) {
    if (! fs.existsSync(path)) {
        throw Error('Not a file');
    }
    const content = await fs.promises.readFile(path, 'utf8');
    const json = JSON.parse(content);
    let abi = [];
    if(Array.isArray(json)) {
        abi = json;
    } else if(Array.isArray(json.abi)) {
        abi = json.abi;
    }

    return abi;
}

export function loadContract(abi: any) {
    STATE.contract = new (STATE.web3.eth.Contract)(abi, STATE.contractAddress);
}

export function sendTransaction(func: string, ...params: any) {
    if (!STATE.contract) {
        return;
    }
    console.log(STATE.contract.methods[func](...params));
}
