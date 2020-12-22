const Joi = require('joi');
const config = require('config/config');

const testers = Object.keys(config.getProperties().testers);

const testerNameSessionIdSchema = Joi.object({
  testerName: Joi.string().valid(...testers).required(),
  sessionId: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required()
});

const validateTesterNameSessionId = (params) => {
  const { error, value } = testerNameSessionIdSchema.validate(params);
  if (error) {
    const validationError = new Error(error.message);
    validationError.name = error.name;
    throw validationError;
  }
  return value;
};
module.exports = { validateTesterNameSessionId };
