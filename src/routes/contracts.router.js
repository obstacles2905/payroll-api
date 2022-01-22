const express = require('express');
const statusCodes = require('http-status-codes');

const {getProfile} = require('../middleware/getProfile');
const Op = require('sequelize').Op;

const contractsRouter = express.Router();

/**
 * @swagger
 * /contracts:
 *  get:
 *    description: Return the contract only if it belongs to the profile calling
 *    responses:
 *      '200':
 *        description: active contracts that belong to the profile calling or an empty array
 *  parameters:
 *    - name: profile_id
 *      in: headers
 *      description: valid profile_id
 *      required: true
 *      type: string
 */
contractsRouter.get('/', getProfile, async(req, res) => {
    const {Contract} = req.app.get('models');
    const {id: profileId} = req.profile;

    const contracts = await Contract.findAll({
        where: {[Op.or]: [{ContractorId: profileId}, {ClientId: profileId}], [Op.not]: [{status: 'terminated'}]}
    });
    if (!contracts) {
        return res.status(statusCodes.OK).send('No valid contracts found for a listed user');
    }

    res.json(contracts);
});

/**
 * @swagger
 * /contracts/:id:
 *  get:
 *    description: Returns a list of non terminated contracts belonging to a user (client or contractor)
 *    responses:
 *      '200':
 *        description: The specific contract
 *      '403':
 *        description: A profile doesn't own a listed contract
 *      '404':
 *        description: A contract doesn't exist
 *  parameters:
 *    - name: profile_id
 *      in: headers
 *      description: valid profile_id
 *      required: true
 *      type: string
 *    - name: id
 *      in: params
 *      description: contract id
 *      required: true
 *      type: string
 */
contractsRouter.get('/:id', getProfile, async (req, res) =>{
    const {Contract} = req.app.get('models');
    const {id} = req.params;
    const {id: profileId} = req.profile;

    const isContractExist = await Contract.findOne({where: {id}});
    if (!isContractExist) {
        return res.status(statusCodes.NOT_FOUND).send(`A contract doesn't exist`);
    }

    const isContractBelongToProfile = await Contract.findOne({
        where: {id, [Op.or]: [{ContractorId: profileId}, {ClientId: profileId}]}
    });
    if (!isContractBelongToProfile) {
        return res.status(statusCodes.FORBIDDEN).send(`A profile doesn't own a listed contract`);
    }

    res.json(isContractExist);
});

module.exports = contractsRouter;