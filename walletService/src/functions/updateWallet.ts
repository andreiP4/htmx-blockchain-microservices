import { app, HttpRequest, HttpResponseInit, input, InvocationContext, output } from "@azure/functions";
import { Wallet } from "../../wallet";

const sendToCosmosDb = output.cosmosDB({
    connection: 'CosmosDBConnectionString',
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    createIfNotExists: false
});

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c where c.id = {id}',
    connection: 'CosmosDBConnectionString',
});

export async function updateWallet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const response = <Wallet[]>context.extraInputs.get(cosmosInput);

    if (response.length === 0) {
        return { status: 404, body: 'Wallet not found' };
    }
    else {
        const initialWallet = response[0];
        const body = request.params;

        const wallet: Wallet = {
            id: initialWallet.id,
            userId: initialWallet.userId,
            currencyId: initialWallet.currencyId,
            balance: Number(body.balance),
        }

        if (!wallet) {
            return { status: 400, body: 'Cannot update wallet' };
        }

        try {
            context.log('not yet');
            context.extraOutputs.set(sendToCosmosDb, wallet);
            context.log('yay');
            return { status: 200, body: 'Wallet updated' };
        } catch (error) {
            context.error(`Error updating wallet: ${error}`);
            return { status: 500, body: `${error}` };
        }
    }
};

app.http('updateWallet', {
    methods: ['PATCH'],
    route: 'updateWallet/{id}',
    extraInputs: [cosmosInput],
    extraOutputs: [sendToCosmosDb],
    authLevel: 'anonymous',
    handler: updateWallet
});