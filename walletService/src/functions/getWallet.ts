import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { Wallet } from "../../wallet";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c where c.currencyId = {currencyId} AND c.userId = {userId}',
    connection: 'CosmosDBConnectionString',
});

export async function getWallet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const response: Wallet = <Wallet>context.extraInputs.get(cosmosInput)[0];
    if (!response) {
        return {
            status: 404,
            body: 'Wallet not found',
        };
    } else {
        return {
            status: 200,
            body: JSON.stringify(response),
        };
    }
};

app.http('getWallet', {
    methods: ['GET'],
    route: 'getWallet/{userId}/{currencyId}',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getWallet
});
