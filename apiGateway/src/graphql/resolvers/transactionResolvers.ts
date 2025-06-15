import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL;
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL;

export const transactionResolvers = {
    Query: {
        getTransaction: async (_: any, { id }: { id: string }) => {
            try {
                const response = await axios.get(`${TRANSACTION_SERVICE_URL}/api/getTransaction/${id}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching transaction:', error);
                throw new Error('Failed to fetch transaction');
            }
        },

        getTransactions: async () => {
            try {
                const response = await axios.get(`${TRANSACTION_SERVICE_URL}/api/getTransactions`);
                return response.data;
            } catch (error) {
                console.error('Error fetching transactions:', error);
                throw new Error('Failed to fetch transactions');
            }
        },

        getTransactionsBlock: async (_: any, { blockId }: { blockId: string }) => {
            try {
                const response = await axios.get(`${TRANSACTION_SERVICE_URL}/api/getTransactionsBlock/${blockId}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching transactions by block:', error);
                throw new Error('Failed to fetch transactions by block');
            }
        },

        getTransactionsUser: async (_: any, { userId }: { userId: string }) => {
            try {
                const response = await axios.get(`${TRANSACTION_SERVICE_URL}/api/getTransactionsUser/${userId}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching transactions by user:', error);
                throw new Error('Failed to fetch transactions by user');
            }
        },
    },

    Mutation: {
        createTransaction: async (_: any, { receiverId, currencyId, amount }: {
            receiverId: string;
            currencyId: string;
            amount: number;
        }, context: any) => {
            // Ensure user can only create transactions from their own wallets
            if (!context.user) {
                throw new Error('FORBIDDEN');
            }

            if (context.user.id === receiverId) {
                throw new Error('CANNOT_TRANSFER_TO_SELF');
            }

            let senderWalletResponse;
            let receiverWalletResponse;

            try {
                senderWalletResponse = await axios.get(`${WALLET_SERVICE_URL}/api/getWallet/${context.user.id}/${currencyId}`);
                receiverWalletResponse = await axios.get(`${WALLET_SERVICE_URL}/api/getWallet/${receiverId}/${currencyId}`);
            }
            catch (error) {
                throw new Error('WALLET_NOT_FOUND');
            }

            if (!senderWalletResponse.data || !receiverWalletResponse.data) {
                throw new Error('WALLET_NOT_FOUND');
            }

            if (Number(senderWalletResponse.data.balance) < amount) {
                throw new Error('INSUFFICIENT_BALANCE');
            }

            try {
                const response = await axios.post(`${TRANSACTION_SERVICE_URL}/api/createTransaction`, {
                    senderId: context.user.id,
                    receiverId,
                    currencyId,
                    amount
                });
                return response.data;
            } catch (error) {
                console.error('Error creating transaction:', error);
                throw new Error('Failed to create transaction');
            }
        },
    },
};
