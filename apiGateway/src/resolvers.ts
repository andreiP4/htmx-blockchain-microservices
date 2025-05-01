import { Transaction } from "../../types/transaction";
import { Block } from "../../types/block";
import { Wallet } from "../../types/wallet";
import { User } from "../../types/user";
import { Currency } from "../../types/currency";
import crypto from "crypto";

const blockchain: Block[] = [];
const transactionPool: Transaction[] = [];
const wallets: Wallet[] = [];

const createGenesisBlock = (): Block => {
    return {
        index: 0,
        previousHash: "0",
        timestamp: new Date().toISOString(),
        transactions: [],
        hash: "000000",
        nonce: 0,
    };
};
blockchain.push(createGenesisBlock());

const calculateHash = (
    index: number,
    previousHash: string,
    timestamp: string,
    transactions: Transaction[],
    nonce: number
): string => {
    return crypto
        .createHash("sha256")
        .update(index + previousHash + timestamp + JSON.stringify(transactions) + nonce)
        .digest("hex");
};

const findWallet = (userId: string, currencyId: string): Wallet | undefined => {
    return wallets.find(
        (wallet) => wallet.user.id === userId && wallet.currency.id === currencyId
    );
};

const addBlock = (transactions: Transaction[]): Block => {
    const previousBlock = blockchain[blockchain.length - 1];
    const index = previousBlock.index + 1;
    const timestamp = new Date().toISOString();
    const nonce = 0;
    const hash = calculateHash(index, previousBlock.hash, timestamp, transactions, nonce);

    const newBlock: Block = {
        index,
        previousHash: previousBlock.hash,
        timestamp,
        transactions,
        hash,
        nonce,
    };
    blockchain.push(newBlock);

    transactions.forEach(({ sender, receiver, currency, amount }) => {
        const senderWallet = findWallet(sender.id!, currency.id!);
        const receiverWallet = findWallet(receiver.id!, currency.id!);

        if (!senderWallet || !receiverWallet) return;

        senderWallet.balance -= amount;
        receiverWallet.balance += amount;
    });

    return newBlock;
};

const resolvers = {
    Query: {
        getBlockchain: () => blockchain,
        getBlock: (_: any, { index }: { index: number }) =>
            blockchain.find((block) => block.index === index),
        getBalance: (_: any, { userId, currencyId }: { userId: string; currencyId: string }) => {
            const wallet = findWallet(userId, currencyId);
            return wallet ? wallet.balance : 0;
        },
    },
    Mutation: {
        addTransaction: (
            _: any,
            {
                sender,
                receiver,
                currency,
                amount,
            }: {
                sender: User;
                receiver: User;
                currency: Currency;
                amount: number;
            }
        ) => {
            const senderWallet = findWallet(sender.id!, currency.id!);
            if (!senderWallet) return "Sender wallet not found";
            if (senderWallet.balance < amount) return "Insufficient balance";

            const transaction: Transaction = {
                sender,
                receiver,
                currency,
                amount,
                timestamp: new Date(),
            };
            transactionPool.push(transaction);
            return "Transaction added to pool";
        },
        mineBlock: () => {
            if (transactionPool.length === 0) throw new Error("No transactions to mine");
            const block = addBlock([...transactionPool]);
            transactionPool.length = 0;
            return block;
        },
    },
};

export default resolvers;
