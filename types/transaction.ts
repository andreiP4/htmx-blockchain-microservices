import { Currency } from "./currency";
import { User } from "./user";

export type Transaction = {
    sender: User;
    receiver: User;
    currency: Currency;
    amount: number;
    timestamp: Date;
};