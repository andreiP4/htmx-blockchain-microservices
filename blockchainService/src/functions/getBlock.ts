import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { Block } from "../../block";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c where c.id = {id}',
    connection: 'CosmosDBConnectionString',
});

export async function getBlock(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const response = context.extraInputs.get(cosmosInput)[0];
    const block: Block = {
        id: response.id,
        previousHash: response.previousHash,
        timestamp: response.timestamp,
        hash: response.hash,
        nonce: response.nonce,
    }
    if (!block) {
        return {
            status: 404,
            body: 'Block not found',
        };
    } else {
        return {
            status: 200,
            body: JSON.stringify(block),
        };
    }
};

app.http('getBlock', {
    methods: ['GET'],
    route: 'getBlock/{id}',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getBlock
});
