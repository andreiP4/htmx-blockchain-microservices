import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from "@azure/functions";
import { User } from "../../user"
import * as bcrypt from 'bcrypt';

const cosmosInput = input.cosmosDB({
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    sqlQuery: 'SELECT * from c where c.username = {credential} or c.email = {credential}',
    connection: 'CosmosDBConnectionString',
});

export async function loginUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const body = request.params;
    const foundUser = context.extraInputs.get(cosmosInput)[0];
    if (!foundUser) {
        return { status: 401, body: 'Incorrect login' };
    }
    const user: User = {
        id: foundUser.id,
        username: foundUser.username,
        password: foundUser.password,
        email: foundUser.email,
    }
    const passwordCorrect = await bcrypt.compare(body.password, user.password);

    if (!passwordCorrect) {
        return { status: 401, body: 'Incorrect login' };
    }

    const userWithoutPassword = {
        id: user.id,
        username: user.username,
        email: user.email,
    }
    return {
        status: 200,
        body: JSON.stringify(userWithoutPassword),
    };
};

app.http('loginUser', {
    methods: ['POST'],
    extraInputs: [cosmosInput],
    authLevel: 'anonymous',
    handler: loginUser
});
