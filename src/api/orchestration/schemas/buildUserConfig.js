const Joi = require('joi');
const config = require('config/config');
debugger;
const configSchemaProps = config.getSchema().properties;


const buildUserConfigSchema = Joi.object({
  // Resource Object (http://jsonapi.org/format/#document-resource-objects)
  data: Joi.object({
    type: Joi.string().required().valid('testRun'),
    // jsonapi: Attributes may contain any valid JSON value.
    attributes: Joi.object({
      version: Joi.string().required().valid(configSchemaProps.buildUserConfig.properties.version.format),
      sutAuthentication: Joi.object({
        route: Joi.string().min(2).regex(/^\/[a-z]+/i),
        usernameFieldLocater: Joi.string().min(2).required(),
        passwordFieldLocater: Joi.string().min(2).required(),
        submit: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required()
      }).required(),
      sutIp: Joi.string().required().ip(),
      sutPort: Joi.number().required().port(),
      sutProtocol: Joi.string().required().valid('https', 'http'),
      browser: Joi.string().valid(configSchemaProps.sut.properties.browser.format).lowercase().default(config.get('sut.browser')),
      loggedInIndicator: Joi.string().required().error(() => 'A loggedInIndicator is required by the App slave in order to know if a login was successful'),
      reportFormats: Joi.array().items(Joi.string().valid(configSchemaProps.sut.properties.reportFormat.format).lowercase()).unique().default([config.get('sut.reportFormat')])
    }).required(),
    // Relationships: (http://jsonapi.org/format/#document-resource-object-relationships)
    relationships: Joi.object({      
      data: Joi.alternatives().try(
        Joi.array().items(Joi.object({
          type: Joi.string().valid('testSession').required(),
          id: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required()
        })),
        Joi.object({
          type: Joi.string().valid('testSession').required(),
          id: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required()
        })
      )
    }).required()
  }).required(),
  // Array of Resource Object.
  included: Joi.array().items(
    Joi.object({
      type: Joi.string().required().valid('testSession'),
      id: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required(),
      attributes: Joi.object({
        username: Joi.string().min(2).required(),
        password: Joi.string().min(2).required(),
        aScannerAttackStrength: Joi.string().valid(['LOW', 'MEDIUM', 'HIGH', 'INSANE']),
        aScannerAlertThreshold: Joi.string().valid(['LOW', 'MEDIUM', 'HIGH']),
        alertThreshold: Joi.number().integer()
      }),
      relationships: Joi.object({
        data: Joi.array().items(
          Joi.object({
            type: Joi.string().valid('route').required(),
            id: Joi.string().min(2).regex(/^\/[a-z]+/i).required()
          }) // Could be many of these
        )
      })
    }).required(),
    Joi.object({
      type: Joi.string().valid('route').required(),
      id: Joi.string().min(2).regex(/^\/[a-z]+/i).required(),
      attributes: Joi.object()
    })

  ).required()


  
});

module.exports = buildUserConfigSchema;