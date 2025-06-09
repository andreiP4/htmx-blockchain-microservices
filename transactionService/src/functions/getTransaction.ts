import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { Transaction } from "../../transaction";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c where c.id = {id}',
    connection: 'CosmosDBConnectionString',
});

export async function getTransaction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const response = context.extraInputs.get(cosmosInput)[0];
    const transaction: Transaction = {
        id: response.id,
        senderId: response.senderId,
        receiverId: response.receiverId,
        currencyId: response.currencyId,
        blockId: response.blockId,
        amount: response.amount,
        timestamp: response.timestamp
    }
    if (!transaction) {
        return {
            status: 404,
            body: 'Transaction not found',
        };
    } else {
        return {
            status: 200,
            body: JSON.stringify(transaction),
        };
    }
};

app.http('getTransaction', {
    methods: ['GET'],
    route: 'getTransaction/{id}',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getTransaction
});