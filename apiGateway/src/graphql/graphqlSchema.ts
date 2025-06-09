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

const isProduction = __dirname.includes('dist');
const baseDir = isProduction ? __dirname : path.join(__dirname);

// Load GraphQL schema files
const typesArray = loadFilesSync(path.join(baseDir, './types/*.graphql'));
const queriesArray = loadFilesSync(path.join(baseDir, './queries/*.graphql'));
const mutationsArray = loadFilesSync(path.join(baseDir, './mutations/*.graphql'));

// Merge type definitions
const typeDefs = mergeTypeDefs([...typesArray, ...queriesArray, ...mutationsArray]);

// Merge all resolvers
const resolvers = mergeResolvers([
  userResolvers,
  blockResolvers,
  currencyResolvers,
  transactionResolvers,
  walletResolvers,
]);

export const schema: GraphQLSchema = makeExecutableSchema({ typeDefs, resolvers });