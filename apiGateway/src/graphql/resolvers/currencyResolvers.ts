import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const CURRENCY_SERVICE_URL = process.env.CURRENCY_SERVICE_URL;

export const currencyResolvers = {
    Query: {
        getCurrency: async (_: any, { id }: { id: string }) => {
            try {
                const response = await axios.get(`${CURRENCY_SERVICE_URL}/api/getCurrency/${id}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching currency:', error);
                throw new Error('Failed to fetch currency');
            }
        },
        getCurrencies: async (_: any, { search }: { search?: string }) => {
            try {
                const url = search
                    ? `${CURRENCY_SERVICE_URL}/api/getCurrencies/${search}`
                    : `${CURRENCY_SERVICE_URL}/api/getCurrencies/null`;
                const response = await axios.get(url);
                return response.data;
            } catch (error) {
                console.error('Error fetching currencies:', error);
                throw new Error('Failed to fetch currencies');
            }
        },
    },
};
