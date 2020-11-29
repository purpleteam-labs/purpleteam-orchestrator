const Joi = require('joi');
const config = require('config/config');

const testers = Object.keys(config.getProperties().testers);

const namesSessionIdsSchema = Joi.object({
  testerName: Joi.string().valid(...testers).required(),
  sessionId: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required()
});


const testerNameSessionId = (params) => namesSessionIdsSchema.validate(params);


module.exports = { testerNameSessionId };
