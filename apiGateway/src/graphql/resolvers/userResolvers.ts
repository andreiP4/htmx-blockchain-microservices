import axios from 'axios';
import { generateTokens } from '../../auth/generateTokens';
import { refreshTokens } from '../../auth/refreshTokens';
import dotenv from 'dotenv';
dotenv.config();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

export const userResolvers = {
    Query: {
        getUser: async (_: any, { id }: { id: string }) => {
            try {
                const response = await axios.get(`${USER_SERVICE_URL}/api/getUser/${id}`);
                return response.data;
            } catch (error) {
                throw new Error('Failed to fetch user');
            }
        },

        getUsers: async (_: any, { search }: { search?: string }) => {
            try {
                const url = search
                    ? `${USER_SERVICE_URL}/api/getUsers/${search}`
                    : `${USER_SERVICE_URL}/api/getUsers/null`;
                const response = await axios.get(url);
                return response.data;
            } catch (error) {
                throw new Error('Failed to fetch users');
            }
        },
    },

    Mutation: {
        registerUser: async (_: any, { username, email, password }: {
            username: string;
            email: string;
            password: string;
        }) => {
            try {
                const response = await axios.post(`${USER_SERVICE_URL}/api/registerUser`, {
                    username,
                    email,
                    password
                });

                const user = response.data;
                const tokens = generateTokens({ id: user.id, username: user.username });

                return {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                };
            } catch (error) {
                throw new Error('Failed to register user');
            }
        },

        loginUser: async (_: any, { credential, password }: {
            credential: string;
            password: string;
        }) => {
            try {
                const response = await axios.post(`${USER_SERVICE_URL}/api/loginUser`, {
                    credential,
                    password
                });

                const user = response.data;
                const tokens = generateTokens({ id: user.id, username: user.username });

                return {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                };
            } catch (error) {
                throw new Error('Failed to login user');
            }
        },

        refreshToken: async (_: any, { refreshToken }: { refreshToken: string }) => {
            try {
                const tokens = refreshTokens(refreshToken);

                return {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.newRefreshToken
                };
            } catch (error) {
                throw new Error('Failed to refresh token');
            }
        },
    },
};
