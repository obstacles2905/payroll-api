const statusCodes = require('http-status-codes');

const getClient = async (req, res, next) => {
    const {Profile} = req.app.get('models');
    const profile = await Profile.findOne({where: {id: req.get('profile_id') || 0, type: 'client'}});
    if(!profile) return res.status(statusCodes.UNAUTHORIZED).send('Invalid user or user is not a client').end();

    req.profile = profile;
    next();
};
module.exports = {getClient};