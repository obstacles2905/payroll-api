const app = require('../src/app');
const supertest = require('supertest');
const statusCodes = require('http-status-codes');

const server = app.listen();
const request = supertest.agent(server);

describe('Admin endpoints', () => {
    describe('GET /best-profession', () => {
        it('Should throw Bad Request if there is no start date param', async() => {
            const response = await request.get('/admin/best-profession')
                .set('profile_id', 1)
                .query({start: '2021-01-21 00:00:00.000'});

            expect(response.statusCode).toBe(statusCodes.BAD_REQUEST);
        });

        it('Should throw Bad Request if there is no start date param', async() => {
            const response = await request.get('/admin/best-profession')
                .set('profile_id', 1)
                .query({end: '2021-01-21 00:00:00.000'});

            expect(response.statusCode).toBe(statusCodes.BAD_REQUEST);
        });

        it('Should return OK for a valid response', async () => {
            const response = await request.get('/admin/best-profession')
                .set('profile_id', 1)
                .query({start: '2015-01-21 00:00:00.000', end: '2021-01-21 00:00:00.000'});

            expect(response.body).toHaveProperty('length');
            expect(response.statusCode).toBe(statusCodes.OK);
        })
    });
});