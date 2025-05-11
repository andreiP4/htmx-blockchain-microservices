import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { generateTokens } from "./generateTokens";
import * as jwt from 'jsonwebtoken';

export async function refreshToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const body = request.params;
    const refreshToken = body.refreshToken;

    if (!refreshToken) {
        return {
            status: 401,
            body: "Access denied",
        };
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const payload = decoded as { id: string; username: string };
        const { id, username } = payload;
        const { accessToken, refreshToken: newRefreshToken } = generateTokens({ id: id, username: username });

        return {
            status: 200,
            body: JSON.stringify({
                accessToken: accessToken,
                refreshToken: newRefreshToken,
            }),
        }
    } catch (error) {
        console.error(error);
        return { status: 401, body: "Access denied." };
    }
};

app.http('refreshToken', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: refreshToken
});
