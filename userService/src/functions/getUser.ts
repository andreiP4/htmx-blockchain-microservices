import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { User } from "../../user";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c where c.id = {id}',
    connection: 'CosmosDBConnectionString',
});

export async function getUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const response = context.extraInputs.get(cosmosInput)[0];
    const user: User = {
        id: response.id,
        username: response.username,
    }
    if (!user) {
        return {
            status: 404,
            body: 'User not found',
        };
    } else {
        return {
            status: 200,
            body: JSON.stringify(user),
        };
    }
};

app.http('getUser', {
    methods: ['GET'],
    route: 'getUser/{id}',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getUser
});
