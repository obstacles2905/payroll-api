const express = require('express');
const {getClient} = require('../middleware/getClient');
const {sequelize} = require('../model');
const statusCodes = require('http-status-codes');

const balancesRouter = express.Router();

/**
 * @swagger
 * /balances/deposit/:userId:
 *  post:
 *    description: Deposits money into the balance of a client, a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
 *    responses:
 *      '200':
 *        description: Deposit successful
 *      '400':
 *        description: deposit amount is not provided OR profile_id and user_id to deposit money to are the same OR a deposit amount is more than 25% of a person balance
 *      '500':
 *        description: internal error leading to a db transaction been rollbacked
 *
 *  parameters:
 *    - name: profile_id
 *      in: headers
 *      description: Valid profile_id
 *      required: true
 *      type: string
 *    - name: userId
 *      in: params
 *      description: Valid userId to deposit money to
 *      required: true
 *      type: string
 */
balancesRouter.post('/deposit/:userId', getClient, async(req, res) => {
    const {Profile} = req.app.get('models');
    const {userId} = req.params;

    if (!Number(userId)) {
        return res.status(statusCodes.BAD_REQUEST).send('Inappropriate userId provided');
    }
    if (!req.body || !req.body.amount) {
        return res.status(statusCodes.BAD_REQUEST).send('An amount property was not passed');
    }

    const {amount} = req.body;
    const {id: profileId, balance} = req.profile;

    if (Number(profileId) === Number(userId)) {
        return res.status(statusCodes.BAD_REQUEST).send('You cannot deposit to your own account');
    }

    const isDepositAmountValid = Number(amount) <= Number(balance) * 0.25;
    if (!isDepositAmountValid) {
        return res.status(statusCodes.BAD_REQUEST).send(`You cannot deposit more than 25% of your current balance. \n Deposit amount: ${amount}, Current balance: ${balance}`);
    }

    const clientExist = await Profile.findOne({
        attributes: ['id'],
        where: {id: userId, type: 'client'}
    });
    if (!clientExist) {
        return res.status(statusCodes.BAD_REQUEST).send(`User either doesn't exist or is not a client`);
    }

    try {
        transaction = await sequelize.transaction();
        await Promise.all([
            Profile.increment('balance', {
                by: -amount,
                where: {id: profileId},
                transaction,
                lock: true
            }, {transaction}),
            Profile.increment('balance', {
                by: amount,
                where: {id: clientExist.id},
                transaction,
                lock: true
            }, {transaction})
        ]);
        await transaction.commit();
    } catch(err) {
        if (transaction) {
            await transaction.rollback();
            return res.status(statusCodes.INTERNAL_SERVER_ERROR).send(`Deposit failed`);
        }
    }

    return res.status(statusCodes.OK).send(`Deposit successful`);
});

module.exports = balancesRouter;