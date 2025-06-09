import { app, HttpRequest, HttpResponseInit, InvocationContext, input } from "@azure/functions";
import { Block } from "../../block";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: "SELECT * FROM c",
    connection: 'CosmosDBConnectionString',
});

export async function getBlockchain(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    let blocks: Block[] = [];
    const response: Block[] = <Block[]>context.extraInputs.get(cosmosInput);
    response.forEach((element: any) => {
        blocks.push({
            id: element.id,
            previousHash: element.previousHash,
            timestamp: element.timestamp,
            hash: element.hash,
            nonce: element.nonce,
        });
    });
    return {
        body: JSON.stringify(blocks),
    };
};

app.http('getBlockchain', {
    methods: ['GET'],
    route: 'getBlockchain',
    extraInputs: [cosmosInput],
    authLevel: 'anonymous',
    handler: getBlockchain
});
