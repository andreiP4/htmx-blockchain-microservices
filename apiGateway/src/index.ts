import express from 'express';
import dotenv from 'dotenv';
import { baseTemplate } from '../../views/index';
import path from 'path';
import { createHandler } from 'graphql-http/lib/use/http';
import { schema } from './graphqlSchema';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send(baseTemplate(''));
});

app.all('/api', createHandler({ schema }));

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});