import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { generateTokens } from './generateTokens';

dotenv.config();

export function refreshTokens(refreshToken: string): { accessToken: string, newRefreshToken: string } {

    if (!refreshToken) {
        throw new Error("Access denied");
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!);
    const payload = decoded as { id: string; username: string };
    const { id, username } = payload;
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({ id: id, username: username });

    return { accessToken, newRefreshToken };
}