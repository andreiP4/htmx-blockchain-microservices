import { app, HttpRequest, HttpResponseInit, InvocationContext, input } from "@azure/functions";
import { Currency } from "../../currency";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c where c.id = {id}',
    connection: 'CosmosDBConnectionString',
});

export async function getCurrency(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const response = context.extraInputs.get(cosmosInput)[0];
    const currency: Currency = {
        id: response.id,
        name: response.name,
        icon: response.icon,
        usdValue: response.usdValue
    }
    if (!currency) {
        return {
            status: 404,
            body: 'Currency not found',
        };
    } else {
        return {
            status: 200,
            body: JSON.stringify(currency),
        };
    }
};

app.http('getCurrency', {
    methods: ['GET'],
    route: 'getCurrency/{id}',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getCurrency
});
