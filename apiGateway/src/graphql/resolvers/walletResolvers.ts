import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL;

export const walletResolvers = {
    Query: {
        getWallet: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user) {
                throw new Error('UNAUTHORIZED');
            }

            try {
                const response = await axios.get(`${WALLET_SERVICE_URL}/api/getWallet/${context.user.id}/${id}`);
                const wallet = response.data;

                // Ensure user can only access their own wallets
                if (wallet.userId !== context.user.id) {
                    throw new Error('FORBIDDEN');
                }

                return wallet;
            } catch (error) {
                console.error('Error fetching wallet:', error);
                throw new Error('Failed to fetch wallet');
            }
        },

        getWallets: async (_: any, { search }: { search?: string }, context: any) => {
            // Ensure user can only access their own wallets
            if (!context.user) {
                throw new Error('FORBIDDEN');
            }

            try {
                const url = search
                    ? `${WALLET_SERVICE_URL}/api/getWallets/${context.user.id}/${search}`
                    : `${WALLET_SERVICE_URL}/api/getWallets/${context.user.id}/null`;
                const response = await axios.get(url);
                return response.data;
            } catch (error) {
                console.error('Error fetching wallets:', error);
                throw new Error('Failed to fetch wallets');
            }
        },
    },

    Mutation: {
        createWallet: async (_: any, { currencyId }: {
            currencyId: string;
        }, context: any) => {
            // Ensure user can only create wallets for themselves
            if (!context.user) {
                throw new Error('FORBIDDEN');
            }

            try {
                const response = await axios.post(`${WALLET_SERVICE_URL}/api/createWallet`, {
                    userId: context.user.id,
                    currencyId
                });
                return response.data;
            } catch (error) {
                console.error('Error creating wallet:', error);
                throw new Error('Failed to create wallet');
            }
        },
    },
};
