const app = require('../src/app');
const supertest = require('supertest');
const statusCodes = require('http-status-codes');

const server = app.listen();
const request = supertest.agent(server);

describe('Contracts endpoints', () => {
   describe('POST /balances/deposit/:userId', () => {
        it('Should return Bad Request for an invalid userId', async() => {
            const response = await request.post(`/balances/deposit/${NaN}`)
                .set('profile_id', 1);

            expect(response.statusCode).toBe(statusCodes.BAD_REQUEST);
            expect(response.text).toBe('Inappropriate userId provided');
        });

        it('Should return Bad Request if no amount was provided', async() => {
            const response = await request.post(`/balances/deposit/2`)
                .set('profile_id', 1);

            expect(response.statusCode).toBe(statusCodes.BAD_REQUEST);
            expect(response.text).toBe('An amount property was not passed');
       });

       it('Should return Bad Request if profile_id = userId', async() => {
           const profile_id = 1;
           const response = await request.post(`/balances/deposit/${profile_id}`)
               .set('profile_id', profile_id)
               .send({amount: 100});

           expect(response.statusCode).toBe(statusCodes.BAD_REQUEST);
           expect(response.text).toBe('You cannot deposit to your own account');
       });

       it('Should return Bad Request if amount to deposit is more than 25% of a user balance', async() => {
           const profile_id = 1;
           const response = await request.post(`/balances/deposit/${2}`)
               .set('profile_id', profile_id)
               .send({amount: 1000000000});

           expect(response.statusCode).toBe(statusCodes.BAD_REQUEST);
           expect(response.text).toContain(`You cannot deposit more than 25% of your current balance`);
       });

       it(`Should return Bad Request if user to deposit money to doesn't exist`, async() => {
           const profile_id = 1;
           const notExistingUserId = 999999;
           const response = await request.post(`/balances/deposit/${notExistingUserId}`)
               .set('profile_id', profile_id)
               .send({amount: 1});

           expect(response.statusCode).toBe(statusCodes.BAD_REQUEST);
           expect(response.text).toBe(`User either doesn't exist or is not a client`);
       })
   })
});