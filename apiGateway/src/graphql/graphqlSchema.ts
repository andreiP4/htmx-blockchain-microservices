import { GraphQLSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { mergeResolvers } from '@graphql-tools/merge';
import path from 'path';

// Import all resolvers
import { userResolvers } from './resolvers/userResolvers';
import { blockResolvers } from './resolvers/blockResolvers';
import { currencyResolvers } from './resolvers/currencyResolvers';
import { transactionResolvers } from './resolvers/transactionResolvers';
import { walletResolvers } from './resolvers/walletResolvers';

// Load GraphQL schema files
const typesArray = loadFilesSync(path.join(__dirname, './types/*.graphql'));
const queriesArray = loadFilesSync(path.join(__dirname, './queries/*.graphql'));
const mutationsArray = loadFilesSync(path.join(__dirname, './mutations/*.graphql'));

// Merge type definitions
const typeDefs = mergeTypeDefs([typesArray, queriesArray, mutationsArray]);

// Merge all resolvers
const resolvers = mergeResolvers([
  userResolvers,
  blockResolvers,
  currencyResolvers,
  transactionResolvers,
  walletResolvers,
]);

export const schema: GraphQLSchema = makeExecutableSchema({ typeDefs, resolvers });