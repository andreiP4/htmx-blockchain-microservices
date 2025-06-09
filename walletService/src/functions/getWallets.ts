import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { Wallet } from "../../wallet";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: "SELECT * FROM c WHERE c.userId = {userId} AND (CONTAINS(c.currencyId, {search}) OR {search} = 'null')",
    connection: 'CosmosDBConnectionString',
});

export async function getWallets(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    let wallets: Wallet[] = [];
    const response: Wallet[] = <Wallet[]>context.extraInputs.get(cosmosInput);
    response.forEach((element: Wallet) => {
        wallets.push({
            id: element.id,
            userId: element.userId,
            currencyId: element.currencyId,
            balance: element.balance,
        });
    });
    return {
        body: JSON.stringify(wallets),
    };

};

app.http('getWallets', {
    methods: ['GET'],
    route: 'getWallets/{userId}/{search}',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getWallets
});
