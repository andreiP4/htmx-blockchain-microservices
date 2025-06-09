import express from 'express';
import dotenv from 'dotenv';
import { baseTemplate } from '../../views/index';
import { createHandler } from 'graphql-http/lib/use/http';
import { schema } from './graphql/graphqlSchema';
import { createGraphQLContext } from './auth/tokenVerification';

dotenv.config();

export const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.get('/', (_, res) => {
    res.send(baseTemplate(''));
});

app.all('/api', createHandler({
    schema, 
    context: (req) => createGraphQLContext(req)
}));

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});