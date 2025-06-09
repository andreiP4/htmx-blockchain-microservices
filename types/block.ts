export type Block = {
    id: string;
    previousHash: string;
    timestamp: Date;
    hash: string;
    nonce: number;
};