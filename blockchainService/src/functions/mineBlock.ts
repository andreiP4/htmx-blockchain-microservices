import { app, HttpRequest, HttpResponseInit, InvocationContext, output, input } from "@azure/functions";
import { Block } from "../../block";
import { Transaction } from "../../transaction";
import { QueueServiceClient } from "@azure/storage-queue";
import * as crypto from 'crypto';

const sendToCosmosDb = output.cosmosDB({
    connection: 'CosmosDBConnectionString',
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    createIfNotExists: false
});

const queueOutput = output.storageQueue({
    connection: 'QueueConnectionString',
    queueName: process.env.QueueNameMined
})

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c ORDER BY c._ts DESC OFFSET 0 LIMIT 1',
    connection: 'CosmosDBConnectionString',
});

const calculateHash = (id: string,
    previousHash: string,
    timestamp: string,
    transactions: Transaction[],
    nonce: number): string => {
    return crypto
        .createHash("sha256")
        .update(id + previousHash + timestamp + JSON.stringify(transactions) + nonce)
        .digest("hex");
}

const mineBlockWithProofOfWork = (
    id: string,
    previousHash: string,
    timestamp: string,
    transactions: Transaction[],
    difficulty: number = 2
): { hash: string; nonce: number } => {
    let nonce = 0;
    let hash = calculateHash(id, previousHash, timestamp, transactions, nonce);
    const target = "0".repeat(difficulty);

    while (!hash.startsWith(target)) {
        nonce++;
        hash = calculateHash(id, previousHash, timestamp, transactions, nonce);
    }

    return { hash, nonce };
};

export async function mineBlock(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const body = request.params;
        const minerId = body.minerId;
        const response = context.extraInputs.get(cosmosInput)[0];
        const lastBlock: Block = {
            id: response.id,
            previousHash: response.previousHash,
            timestamp: response.timestamp,
            hash: response.hash,
            nonce: response.nonce
        }
        let transactions: Transaction[] = [];
        let newBlock: Block = null;
        const newBlockId = crypto.randomUUID();

        const queueServiceClient = QueueServiceClient.fromConnectionString(process.env.QueueConnectionString);
        const queueClient = queueServiceClient.getQueueClient(process.env.QueueNamePending);

        const pendingTransactions = await queueClient.peekMessages({ numberOfMessages: 8 });

        if (pendingTransactions.peekedMessageItems.length === 7) {
            for (const element of pendingTransactions.peekedMessageItems) {
                const decoded = Buffer.from(element.messageText, 'base64').toString('utf-8');
                const transaction: Transaction = JSON.parse(decoded);
                transaction.blockId = newBlockId;
                transactions.push(transaction);
            }

            const now = new Date();

            const { hash, nonce } = mineBlockWithProofOfWork(newBlockId, lastBlock.hash, now.toISOString(), transactions);

            newBlock = {
                id: newBlockId,
                previousHash: lastBlock.hash,
                timestamp: now,
                hash,
                nonce,
            };
        }

        if (!newBlock) {
            return { status: 400, body: 'Cannot create block' };
        }

        context.extraOutputs.set(sendToCosmosDb, newBlock);
        let minedTransactions: Transaction[] = [];
        const minedTransactionsQueue = await queueClient.receiveMessages({ numberOfMessages: 8 });
        if (minedTransactionsQueue.receivedMessageItems.length > 0) {
            for (const element of minedTransactionsQueue.receivedMessageItems) {
                const decoded = Buffer.from(element.messageText, 'base64').toString('utf-8');
                const transaction: Transaction = JSON.parse(decoded);
                transaction.blockId = newBlockId;
                minedTransactions.push(transaction);
                await queueClient.deleteMessage(element.messageId, element.popReceipt);
            }
        }
        context.extraOutputs.set(queueOutput, minedTransactions);
        return { status: 201, body: JSON.stringify(newBlock) };
    } catch (error) {
        context.error(`Error creating block: ${error}`);
        return { status: 500, body: `${error}` };
    }
};

app.http('mineBlock', {
    methods: ['POST'],
    route: 'mineBlock',
    extraOutputs: [sendToCosmosDb, queueOutput],
    extraInputs: [cosmosInput],
    authLevel: 'anonymous',
    handler: mineBlock
});
