const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model');

const adminRouter = require('./routes/admin.router');
const balancesRouter = require('./routes/balances.router');
const contractsRouter = require('./routes/contracts.router');
const jobsRouter = require('./routes/jobs.router');

const app = express();
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

app.use(bodyParser.json());

app.use('/admin', adminRouter);
app.use('/balances', balancesRouter);
app.use('/contracts', contractsRouter);
app.use('/jobs', jobsRouter);

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            version: '1.0.1',
            title: 'Deel Task API',
            description: 'Deel Task API Information',
            servers: ['http://localhost:3001']
        },
    },
    apis: ['./src/routes/*.router.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.set('sequelize', sequelize);
app.set('models', sequelize.models);

module.exports = app;
