import { Wallet } from './wallet'
export type User = {
    id?: string;
    username: string;
    email: string;
    password: string;
    wallets: Wallet[]
}