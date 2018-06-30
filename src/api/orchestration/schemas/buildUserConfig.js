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
      sutAuthentication: Joi.object({
        route: Joi.string().min(2).regex(/^\/[a-z]+/i),
        usernameFieldLocater: Joi.string().min(2).required(),
        passwordFieldLocater: Joi.string().min(2).required(),
        submit: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required()
      }).required(),
      sutIp: Joi.string().required().ip(),
      sutPort: Joi.number().required().port(),
      sutProtocol: Joi.string().required().valid('https', 'http'),
      browser: Joi.string().valid(config.getSchema().properties.sut.properties.browser.format).lowercase().default(config.get('sut.browser')),
      loggedInIndicator: Joi.string().required().error(() => 'A loggedInIndicator is required by the App slave in order to know if a login was successful'),
      reportFormats: Joi.array().items(Joi.string().valid(config.getSchema().properties.sut.properties.reportFormat.format).lowercase()).unique().default([config.get('sut.reportFormat')])
    }).required(),
    relationships: Joi.object().required()
  }).required(),
  included: Joi.array().required()
});

module.exports = buildUserConfigSchema;