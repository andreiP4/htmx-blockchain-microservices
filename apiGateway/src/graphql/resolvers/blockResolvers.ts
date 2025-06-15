import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL;

export const blockResolvers = {
    Query: {
        getBlock: async (_: any, { id }: { id: string }) => {
            try {
                const response = await axios.get(`${BLOCKCHAIN_SERVICE_URL}/api/getBlock/${id}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching block:', error);
                throw new Error('Failed to fetch block');
            }
        },

        getBlockchain: async () => {
            try {
                const response = await axios.get(`${BLOCKCHAIN_SERVICE_URL}/api/getBlockchain`);
                return response.data;
            } catch (error) {
                console.error('Error fetching blockchain:', error);
                throw new Error('Failed to fetch blockchain');
            }
        },
    },

    Mutation: {
        mineBlock: async (_: any, __: any, context: any) => {
            if (!context.user) {
                throw new Error('UNAUTHORIZED');
            }

            try {
                const response = await axios.post(`${BLOCKCHAIN_SERVICE_URL}/api/mineBlock`, { minerId: context.user.id });
                return response.data;
            } catch (error) {
                console.error('Error mining block:', error);
                throw new Error('Failed to mine block');
            }
        },
    },
};
