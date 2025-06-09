import { app, HttpRequest, HttpResponseInit, input, InvocationContext, output } from "@azure/functions";
import { randomUUID } from "crypto";
import { Transaction } from "../../transaction";
import { Wallet } from "../../wallet";

const sendToCosmosDb = output.cosmosDB({
    connection: 'CosmosDBConnectionString',
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    createIfNotExists: false
});

const queueOutput = output.storageQueue({
    connection: 'QueueConnectionString',
    queueName: process.env.QueueName
});

const cosmosInput = input.cosmosDB({
    connection: 'CosmosDBConnectionString',
    sqlQuery: 'SELECT * FROM c WHERE c.userId = {senderId} AND c.currencyId = {currencyId}',
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerNameWallets
});

export async function createTransaction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const body = request.params;

    if (body.senderId === body.receiverId) {
        return { status: 400, body: 'Cannot transfer to self' };
    }

    const response: Wallet = <Wallet>context.extraInputs.get(cosmosInput)[0];
    if (!response) {
        return { status: 404, body: 'Sender wallet not found' };
    }
    else if (Number(response.balance) < Number(body.amount)) {
        return { status: 400, body: 'Insufficient balance' };
    }

    const transaction: Transaction = {
        id: randomUUID(),
        senderId: body.senderId,
        receiverId: body.receiverId,
        currencyId: body.currencyId,
        amount: Number(body.amount),
        timestamp: new Date(),
        blockId: null
    }

    if (!transaction) {
        return { status: 400, body: 'Cannot create transaction' };
    }

    try {
        context.extraOutputs.set(sendToCosmosDb, transaction);
        context.extraOutputs.set(queueOutput, transaction);
        return { status: 201, body: JSON.stringify(transaction) };
    } catch (error) {
        context.error(`Error creating transaction: ${error}`);
        return { status: 500, body: `${error}` };
    }
};

app.http('createTransaction', {
    methods: ['POST'],
    extraOutputs: [sendToCosmosDb, queueOutput],
    extraInputs: [cosmosInput],
    authLevel: 'anonymous',
    handler: createTransaction
});
