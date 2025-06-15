import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { Transaction } from "../../transaction";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c',
    connection: 'CosmosDBConnectionString',
});

export async function getTransactions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    let transactions: Transaction[] = [];
    const response: Transaction[] = <Transaction[]>context.extraInputs.get(cosmosInput);
    response.forEach((element: Transaction) => {
        transactions.push({
            id: element.id,
            senderId: element.senderId,
            receiverId: element.receiverId,
            currencyId: element.currencyId,
            blockId: element.blockId,
            amount: element.amount,
            timestamp: element.timestamp
        });
    });
    return {
        status: 200,
        body: JSON.stringify(transactions),
    };
};

app.http('getTransactions', {
    methods: ['GET'],
    route: 'getTransactions',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getTransactions
});