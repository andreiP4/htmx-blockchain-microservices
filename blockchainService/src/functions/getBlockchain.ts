import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Block } from "../../block";

export async function getBlockchain(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';

    return { body: `Hello, ${name}!` };
};

app.http('getBlockchain', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getBlockchain
});
