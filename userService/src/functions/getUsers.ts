import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { User } from "../../user";

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: "SELECT * FROM c WHERE CONTAINS(c.username, {search}) OR {search} = 'null'",
    connection: 'CosmosDBConnectionString',
});

export async function getUsers(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    let users: User[] = [];
    const response: User[] = <User[]>context.extraInputs.get(cosmosInput);
    response.forEach((element: User) => {
        users.push({
            id: element.id,
            username: element.username,
        });
    });
    return {
        body: JSON.stringify(users),
    };

};

app.http('getUsers', {
    methods: ['GET'],
    route: 'getUsers/{search}',
    authLevel: 'anonymous',
    extraInputs: [cosmosInput],
    handler: getUsers
});
