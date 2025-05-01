import { GraphQLSchema } from 'graphql';
import resolvers from './resolvers';
import { makeExecutableSchema } from 'graphql-tools';

const typeDefs = `
  type Block {
    index: Int!
    previousHash: String!
    timestamp: String!
    transactions: [Transaction!]!
    hash: String!
    nonce: Int!
  }

  type Transaction {
    sender: String!
    receiver: String!
    amount: Float!
  }

  type Query {
    getBlockchain: [Block!]!
    getBlock(index: Int!): Block
    getBalance(address: String!): Float!
  }

  type Mutation {
    addTransaction(sender: String!, receiver: String!, amount: Float!): String!
    mineBlock: Block!
  }
`

export const schema: GraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers
});