const Joi = require('joi');
const config = require('config/config');

const testers = Object.keys(config.getProperties().testers);

const namesSessionIdsSchema = Joi.object({
  testerName: Joi.string().valid(...testers).required(),
  sessionId: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required()
});


const testerNameSessionId = (params) => namesSessionIdsSchema.validate(params).value; // When error handling work needs to be done around this, review the sut.js in app-scanner.


module.exports = { testerNameSessionId };
