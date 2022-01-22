const express = require('express');
const {getProfile} = require('../middleware/getProfile');
const {sequelize} = require('../model');
const Op = require('sequelize').Op;
const statusCodes = require('http-status-codes');

const adminRouter = express.Router();

/**
 * @swagger
 * /admin/best-profession:
 *  get:
 *    description: Returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range
 *    responses:
 *      '200':
 *        description: array of most profitable professions (1..limit)
 *      '400':
 *        description: either start or end date queryParams are not provided
 *  parameters:
 *    - name: start
 *      in: query
 *      description: Start date
 *      required: true
 *      type: string
 *    - name: end
 *      in: query
 *      description: End date
 *      required: true
 *      type: string
 */
adminRouter.get('/best-profession', getProfile, async(req, res) => {
    const {start, end, limit = 2} = req.query;
    if (!start || !end) {
        return res.status(statusCodes.BAD_REQUEST).send('One of the required date params are missing: start, end');
    }

    const mostProfitableJobs = await sequelize.query(`
        SELECT sum(j.price) as totalRevenue, p.profession FROM Jobs j
            LEFT JOIN Contracts c ON j.ContractId = c.id
            LEFT JOIN Profiles p ON c.ContractorId = p.id
        WHERE j.paid = 1 AND j.paymentDate BETWEEN '${start}' AND '${end}' AND c.status != 'new'
        GROUP BY p.profession ORDER BY totalRevenue DESC LIMIT ${limit};
    `);

    res.json(mostProfitableJobs[0]);
});

/**
 * @swagger
 * /admin/best-clients:
 *  get:
 *    description: Returns array of clients who paid the most for jobs done in the query time period
 *    responses:
 *      '200':
 *        description: array of clients who payed the most (1..limit)
 *      '400':
 *        description: either start or end date queryParams are not provided
 *  parameters:
 *    - name: start
 *      in: query
 *      description: Start date
 *      required: true
 *      type: string
 *    - name: end
 *      in: query
 *      description: End date
 *      required: true
 *      type: string
 *    - name: limit
 *      in: query
 *      description: limit for response length. has a value of 2 by default if not provided
 *      required: false,
 *      type: string
 */
adminRouter.get('/best-clients', getProfile, async(req, res) => {
    const {start, end, limit = 2} = req.query;
    if (!start || !end) {
        return res.status(statusCodes.BAD_REQUEST).send('One of the required date params are missing: start, end');
    }
    const {Job, Contract} = req.app.get('models');
    const totalPayoutsPerClient = await Job.findAll({
        attributes: [[sequelize.fn('sum', sequelize.col('price')), 'TotalPayouts'],],
        where: {paid: 1, paymentDate: {[Op.between]: [start, end]}},
        include: [{model: Contract, attributes: ['ClientId']}],
        group: ['Contract.ClientId'],
        order: [[sequelize.col('TotalPayouts'), 'DESC']],
        limit,
    });

    const totalPayoutsPerClientTransformed = totalPayoutsPerClient.map(payout => ({
        TotalPayouts: payout.dataValues.TotalPayouts,
        ClientId: payout.Contract.ClientId
    }));

    res.json(totalPayoutsPerClientTransformed);
});

module.exports = adminRouter;