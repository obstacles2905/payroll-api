const statusCodes = require('http-status-codes');

const profileTypes = ['client', 'contractor'];

const getProfile = async (req, res, next) => {
    const {Profile} = req.app.get('models');
    const profile = await Profile.findOne({where: {id: req.get('profile_id') || 0}});
    if (!profile) return res.status(statusCodes.UNAUTHORIZED).send('Invalid user').end();

    if (!profile.type || !profileTypes.includes(profile.type)) {
        return res.status(statusCodes.FORBIDDEN).send('A profile type is not allowed').end();
    }
    req.profile = profile;
    next();
};
module.exports = {getProfile};