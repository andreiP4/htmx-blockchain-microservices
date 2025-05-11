import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";
import { Wallet } from "../../wallet";
import { randomUUID } from "crypto";

const sendToCosmosDb = output.cosmosDB({
    connection: 'CosmosDBConnectionString',
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    createIfNotExists: false
});

export async function createWallet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const body = request.params;
    const wallet: Wallet = {
        id: randomUUID(),
        userId: body.userId,
        currencyId: body.currencyId,
        balance: Number(body.balance),
    }

    if (!wallet) {
        return { status: 400, body: 'Cannot create wallet' };
    }

    try {
        context.extraOutputs.set(sendToCosmosDb, wallet);
        return { status: 201, body: 'Wallet created' };
    } catch (error) {
        context.error(`Error creating wallet: ${error}`);
        return { status: 500, body: `${error}` };
    }
};

app.http('createWallet', {
    methods: ['POST'],
    extraOutputs: [sendToCosmosDb],
    authLevel: 'anonymous',
    handler: createWallet
});