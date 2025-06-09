import * as jwt from 'jsonwebtoken';

export interface AuthUser {
    id: string;
    username: string;
}

export function verifyAuthToken(authHeader: string | undefined): AuthUser | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
        return payload;
    } catch (error) {
        console.log('JWT verification failed:', error);
        return null;
    }
}

export function createGraphQLContext(req: any) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const user = verifyAuthToken(authHeader);

    return { user };
}
