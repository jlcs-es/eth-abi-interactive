import Web3 from 'web3';
import * as fs from 'fs';

export function newConnection() {
    const web3 = new Web3('http://localhost:8545');
    return web3;
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
