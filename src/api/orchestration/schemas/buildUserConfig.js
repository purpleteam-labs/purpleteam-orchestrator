const Joi = require('joi');
const config = require('config/config');

const buildUserConfigSchema = Joi.object({
  // Resource Object (http://jsonapi.org/format/#document-resource-objects)
  data: Joi.object({
    type: Joi.string().required().valid('testRun'),
    attributes: Joi.object({
      version: Joi.string().required().valid(config.getSchema().properties.buildUserConfig.properties.version.format)
    }),
    relationships: Joi.object()
  }),
  included: Joi.array()
});

module.exports = buildUserConfigSchema;