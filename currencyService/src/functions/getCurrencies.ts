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
    let currencies: Currency[] = [];
    const response: Currency[] = <Currency[]>context.extraInputs.get(cosmosInput);
    response.forEach((element: Currency) => {
        currencies.push({
            id: element.id,
            name: element.name,
            icon: element.icon,
            usdValue: element.usdValue
        });
    });
    return {
        status: 200,
        body: JSON.stringify(currencies),
    };
};

app.http('getCurrencies', {
    methods: ['GET'],
    route: 'getCurrencies/{search}',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getCurrencies
});
