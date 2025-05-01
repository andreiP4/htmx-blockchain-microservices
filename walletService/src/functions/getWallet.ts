import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { Wallet } from "../../wallet";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c where c.id = {id}',
    connection: 'CosmosDBConnectionString',
});

export async function getWallet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const response = context.extraInputs.get(cosmosInput)[0];
    const wallet: Wallet = {
        id: response.id,
        userId: response.userId,
        currencyId: response.currencyId,
        balance: response.balance,
    }
    if (!wallet) {
        return {
            status: 404,
            body: 'Wallet not found',
        };
    } else {
        return {
            body: JSON.stringify(wallet),
        };
    }
};

app.http('getWallet', {
    methods: ['GET'],
    route: 'getWallet/{id}',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getWallet
});
