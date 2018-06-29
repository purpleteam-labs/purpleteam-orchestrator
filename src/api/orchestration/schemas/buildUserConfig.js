const Joi = require('joi');

const buildUserConfigSchema = Joi.object({
  data: Joi.object({
    type: Joi.string().required().valid('testRun')
  }),
  included: Joi.array()
});

module.exports = buildUserConfigSchema;