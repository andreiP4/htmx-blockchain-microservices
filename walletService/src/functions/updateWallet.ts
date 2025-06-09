import { app, input, InvocationContext, output } from "@azure/functions";
import { Wallet } from "../../wallet";

const sendToCosmosDb = output.cosmosDB({
    connection: 'CosmosDBConnectionString',
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    createIfNotExists: false
});

const cosmosInputSender = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * FROM c WHERE c.userId = {senderId} AND c.currencyId = {currencyId}',
    connection: 'CosmosDBConnectionString',
});

const cosmosInputReceiver = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * FROM c WHERE c.userId = {receiverId} AND c.currencyId = {currencyId}',
    connection: 'CosmosDBConnectionString',
});

const queueOutput = output.storageQueue({
    connection: 'QueueConnectionString',
    queueName: process.env.QueueNamePending
})

export async function updateWallet(queueItem: unknown, context: InvocationContext): Promise<void> {
    const response = JSON.parse(JSON.stringify(queueItem));
    let senderWallet: Wallet = <Wallet>context.extraInputs.get(cosmosInputSender)[0];
    let receiverWallet: Wallet = <Wallet>context.extraInputs.get(cosmosInputReceiver)[0];

    if (!senderWallet || !receiverWallet) {
        return;
    }

    if (response.senderId !== senderWallet.userId) {
        return;
    }

    if (response.receiverId !== receiverWallet.userId) {
        return;
    }

    if (Number(senderWallet.balance) < Number(response.amount)) {
        return;
    }

    senderWallet.balance = Number(senderWallet.balance) - Number(response.amount);
    receiverWallet.balance = Number(receiverWallet.balance) + Number(response.amount);

    context.extraOutputs.set(sendToCosmosDb, [senderWallet, receiverWallet]);
    context.extraOutputs.set(queueOutput, response);
};

app.storageQueue('updateWallet', {
    queueName: process.env.QueueName,
    connection: 'QueueConnectionString',
    extraInputs: [cosmosInputSender, cosmosInputReceiver],
    extraOutputs: [sendToCosmosDb, queueOutput],
    handler: updateWallet
})