import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { Currency } from "../../currency";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: "SELECT * FROM c WHERE CONTAINS(c.id, {search}) OR {search} = 'null'",
    connection: 'CosmosDBConnectionString',
});

export async function getCurrencies(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';

    return { body: `Hello, ${name}!` };
};

app.http('getCurrencies', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getCurrencies
});
