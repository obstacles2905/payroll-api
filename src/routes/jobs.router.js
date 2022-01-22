const express = require('express');
const {getClient} = require('../middleware/getClient');
const {getProfile} = require('../middleware/getProfile');
const {sequelize} = require('../model');
const Op = require('sequelize').Op;
const statusCodes = require('http-status-codes');

const jobsRouter = express.Router();

/**
 * @swagger
 * /jobs/:job_id/pay:
 *  post:
 *    description: Pay for a job, a client can only pay if his balance >= the amount to pay. The amount should be moved from the client's balance to the contractor balance.
 *    responses:
 *      '200':
 *        description: Job has been successfully paid
 *      '400':
 *        description: If user lacks money on his balance
 *      '404':
 *        description: Job is not found or is already paid or you're not allowed to see it
 *      '500':
 *        description: internal error leading to a db transaction been rollbacked
 *
 *  parameters:
 *    - name: profile_id
 *      in: headers
 *      description: valid client_id
 *      required: true
 *      type: string
 *    - name: job_id
 *      in: params
 *      description: valid job id to pay for
 *      required: true
 *      type: string
 */
jobsRouter.post('/:job_id/pay', getClient, async(req, res) => {
    const {Contract, Job, Profile} = req.app.get('models');
    const {job_id} = req.params;
    const {id: profileId, balance} = req.profile;

    const job = await Job.findOne({
        attributes: ['id', 'price', 'updatedAt', 'ContractId'],
        where: {id: job_id, paid: null, paymentDate: null},
        include: [{model: Contract, where: {ClientId: profileId, status: 'in_progress'}}]
    });
    if (!job) {
        return res.status(statusCodes.BAD_REQUEST).send(`Job is not found or is already paid or you're not allowed to see it`);
    }
    const {id: jobId, price, ContractId} = job.dataValues;

    if (balance < price) {
        return res.status(statusCodes.BAD_REQUEST).send(`Insufficient funds`);
    }

    const contractorId = job.dataValues.Contract.ContractorId;

    let transaction;
    try {
        transaction = await sequelize.transaction();
        await Promise.all([
            Profile.increment('balance', {
                by: -price,
                where: {id: profileId},
                transaction,
                lock: true
            }, {transaction}),
            Profile.increment('balance', {
                by: price,
                where: {id: contractorId},
                transaction,
                lock: true
            }, {transaction}),
            Job.update({paid: 1, paymentDate: new Date()}, {where: {id: jobId}, transaction, lock: true}, {transaction}).then(async () => {
                const isAllJobsPerContractDone = await Job.findAll({where: {ContractId, paid: null}, transaction, lock: true});
                if (isAllJobsPerContractDone) {
                    return Contract.update(
                        {status: 'terminated'},
                        {
                            where: {
                                status: 'in_progress',
                                ContractorId: contractorId,
                                ClientId: profileId
                            },
                            transaction,
                            lock: true
                        });
                }
            })
        ]);
        await transaction.commit();
    } catch(err) {
        if (transaction) {
            await transaction.rollback();
            return res.status(statusCodes.INTERNAL_SERVER_ERROR).send('Payment failed');
        }
    }

    res.json(job);
});


/**
 * @swagger
 * /jobs/unpaid:
 *  get:
 *    description: Get all unpaid jobs for either a client or a contractor, for an active contracts only.
 *    responses:
 *      '200':
 *        description: No valid contracts found for a listed user OR No unpaid jobs found
 *
 *  parameters:
 *    - name: profile_id
 *      in: headers
 *      description: valid client_id
 *      required: true
 *      type: string
 */
jobsRouter.get('/unpaid', getProfile, async(req, res) => {
    const {Contract, Job} = req.app.get('models');
    const {id: profileId} = req.profile;

    const contracts = await Contract.findAll({
        attributes: ['id'],
        where: {[Op.or]: [{ContractorId: profileId}, {ClientId: profileId}], [Op.not]: [{status: 'terminated'}]}
    });
    if (!contracts) {
        return res.status(statusCodes.OK).send('No valid contracts found for a listed user');
    }
    const contractsIds = contracts.map(c => c.dataValues.id);

    const unpaidJobs = await Job.findAll({where: {id: contractsIds, paid: null, paymentDate: null}});
    if (!unpaidJobs) {
        return res.status(statusCodes.OK).send('No unpaid jobs found');
    }

    res.json(unpaidJobs);
});

module.exports = jobsRouter;