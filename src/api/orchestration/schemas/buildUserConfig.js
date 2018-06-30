const Joi = require('joi');
const config = require('config/config');
debugger;
const buildUserConfigSchema = Joi.object({
  // Resource Object (http://jsonapi.org/format/#document-resource-objects)
  data: Joi.object({
    type: Joi.string().required().valid('testRun'),
    // jsonapi: Attributes may contain any valid JSON value.
    attributes: Joi.object({
      version: Joi.string().required().valid(config.getSchema().properties.buildUserConfig.properties.version.format),
      sutAuthentication: Joi.object().required(),
      sutIp: Joi.string().required().ip(),
      sutPort: Joi.number().required().port(),
      sutProtocol: Joi.string().required().valid('https', 'http'),
      browser: Joi.string().valid(config.getSchema().properties.sut.properties.browser.format).lowercase().default(config.get('sut.browser')),
      loggedInIndicator: Joi.string(),
      reportFormats: Joi.array().items(Joi.string().valid(config.getSchema().properties.sut.properties.reportFormat.format).lowercase()).unique().default([config.get('sut.reportFormat')])
    }).required(),
    relationships: Joi.object().required()
  }).required(),
  included: Joi.array().required()
});

module.exports = buildUserConfigSchema;