import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";
import { User } from "../../user"
import * as bcrypt from 'bcrypt';
import { randomUUID } from "crypto";

const sendToCosmosDb = output.cosmosDB({
    connection: 'CosmosDBConnectionString',
    databaseName: process.env.CosmosDBDatabaseName,
    containerName: process.env.CosmosDBContainerName,
    createIfNotExists: false
});

export async function registerUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const body = request.params;
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user: User = {
        id: randomUUID(),
        username: body.username,
        password: hashedPassword,
        email: body.email,
    }

    if (!user) {
        return { status: 400, body: 'Cannot create user' };
    }

    try {
        context.extraOutputs.set(sendToCosmosDb, user);
        return { status: 201, body: 'Successfully registered!' };
    } catch (error) {
        context.error(`Error creating wallet: ${error}`);
        return { status: 500, body: `${error}` };
    }
};

app.http('registerUser', {
    methods: ['POST'],
    extraOutputs: [sendToCosmosDb],
    authLevel: 'anonymous',
    handler: registerUser
});
