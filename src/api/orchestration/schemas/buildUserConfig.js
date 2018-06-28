const Joi = require('joi');

const buildUserConfigSchema = Joi.object({
  data: Joi.object(),
  included: Joi.array()
});

module.exports = buildUserConfigSchema;