export type Transaction = {
    id: string;
    senderId: string;
    receiverId: string;
    blockId?: string;
    currencyId: string;
    amount: number;
    timestamp: Date;
};