import { Transaction } from "./transaction";

export type Block = {
    index: number;
    previousHash: string;
    timestamp: string;
    transactions: Transaction[];
    hash: string;
    nonce: number;
};