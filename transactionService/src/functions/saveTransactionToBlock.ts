import { app, InvocationContext, output } from "@azure/functions";
import { Transaction } from "../../transaction";

const sendToCosmosDb = output.cosmosDB({
    connection: 'CosmosDBConnectionString',
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    createIfNotExists: false
});

export async function saveTransactionToBlock(queueItem: unknown, context: InvocationContext): Promise<void> {
    const response = JSON.parse(JSON.stringify(queueItem));

    const transaction: Transaction = {
        id: response.id,
        senderId: response.senderId,
        receiverId: response.receiverId,
        currencyId: response.currencyId,
        amount: response.amount,
        timestamp: response.timestamp,
        blockId: response.blockId,
    }

    if (transaction) {
        try {
            context.extraOutputs.set(sendToCosmosDb, transaction);
        } catch (error) {
            context.error(`Error saving transaction: ${error}`);
        }
    }
};

app.storageQueue('saveTransaction', {
    queueName: process.env.QueueNameMined,
    connection: 'QueueConnectionString',
    extraOutputs: [sendToCosmosDb],
    handler: saveTransactionToBlock
});