const app = require('../src/app');
const supertest = require('supertest');
const statusCodes = require('http-status-codes');

const server = app.listen();
const request = supertest.agent(server);

describe('Contracts endpoints', () => {
    describe('GET /contracts', () => {
        it('Should throw Unathorized if there is no profile_id', async() => {
            const response = await request.get('/contracts');

            expect(response.statusCode).toBe(statusCodes.UNAUTHORIZED);
        });

        it(`Should throw Unathorized if a provided profile_id is invalid`, async() => {
            const response = await request.get('/contracts')
            .set('profile_id', NaN);

            expect(response.statusCode).toBe(statusCodes.UNAUTHORIZED);
        });

        it('Should return OK if profile_id exists', async() => {
            const response = await request.get('/contracts')
                .set('profile_id', 1);

            expect(response.statusCode).toBe(statusCodes.OK);
        })
    });

    describe('GET /contracts/:id', () => {
        it(`Should throw Not Found if provided contract doesn't exist`, async() => {
            const response = await request.get(`/contracts/${NaN}`)
                .set('profile_id', 1);

            expect(response.status).toBe(statusCodes.NOT_FOUND);
        });

        it(`Should return OK if provided contract is valid and belongs to the user`, async() => {
            const response = await request.get(`/contracts/${1}`)
                .set('profile_id', 1);

            expect(response.status).toBe(statusCodes.OK);
        });
    });
});