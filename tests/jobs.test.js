const app = require('../src/app');
const supertest = require('supertest');
const statusCodes = require('http-status-codes');

const server = app.listen();
const request = supertest.agent(server);

describe('Contracts endpoints', () => {
    describe('GET /jobs/unpaid', () => {
        it(`Should return OK if there are no valid contracts for a user`, async() => {
            const response = await request.get('/jobs/unpaid')
                .set('profile_id', 1);

            expect(response.statusCode).toBe(statusCodes.OK);
        });

        it(`Should return OK if there are no unpaid jobs for a user`, async() => {
            const response = await request.get('/jobs/unpaid')
                .set('profile_id', 1);

            expect(response.statusCode).toBe(statusCodes.OK);
        })
    });
});