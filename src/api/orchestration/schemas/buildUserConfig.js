const Joi = require('joi');
const config = require('config/config');
debugger;
const configSchemaProps = config.getSchema().properties;



const internals = {
  includedCount: 0,
  testSessionCount: 0,
  routeCount: 0
}

const includedSchema = () => {
  debugger;

  const testSessionSchema =  Joi.object({
    type: Joi.string().required().valid('testSession'),
    id: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required(),
    attributes: Joi.object({
      username: Joi.string().min(2).required(),
      password: Joi.string().min(2).required(),
      // Sourced from app-scanner config
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
    }).required()
  }).required();

  const routeSchema = Joi.object({
    type: Joi.string().valid('route').required(),
    id: Joi.string().min(2).regex(/^\/[a-z]+/i).required(),
    attributes: Joi.object()
  }).required();

  const duplicateSchemaItems = (itemCount, schema) => {
    const array = Array.apply(null, Array(itemCount));
    return array.map((current, index) => schema);
  };  

  const sus = [...duplicateSchemaItems(internals.testSessionCount, testSessionSchema), ...duplicateSchemaItems(internals.routeCount, routeSchema)];

  return Joi.array().items(...duplicateSchemaItems(internals.testSessionCount, testSessionSchema), ...duplicateSchemaItems(internals.routeCount, routeSchema));




};

const buildUserConfigSchema = serialisedBuildUserConfig => {
  debugger;

  const buildUserConfig = JSON.parse(serialisedBuildUserConfig);
  const testSessions = buildUserConfig.included.filter(element => element.type === 'testSession');
  internals.testSessionCount = testSessions.length;

  let routeResourceIdentifierObjects = [];

  testSessions.forEach((current) => {
    debugger;
    routeResourceIdentifierObjects.push(...current.relationships.data.filter(element => element.type === 'route'));

  });

  const uniqueRouteResourceIdentifierObjects = [...(new Set(routeResourceIdentifierObjects))];

  internals.routeCount = uniqueRouteResourceIdentifierObjects.length;

  //if(includedCount < 2 || !!(includedCount % 2)) throw new Error('child "included" fails because ["included" does not contain at least a pair of "testSession" and "route" objects]');

  //internals.includedCount = includedCount;
  return Joi.validate(serialisedBuildUserConfig, schema);
};







const schema = Joi.object({
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
  included: Joi.lazy(includedSchema).required()/*Joi.array().items(
    
    Joi.object({
      type: Joi.string().required().valid('testSession'),
      id: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required(),
      attributes: Joi.object({
        username: Joi.string().min(2).required(),
        password: Joi.string().min(2).required(),
        // Sourced from app-scanner config
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
      }).required()
    }).required(),
    Joi.object({
      type: Joi.string().valid('route').required(),
      id: Joi.string().min(2).regex(/^\/[a-z]+/i).required(),
      attributes: Joi.object()
    }).required()

  ).length(count).required()
*/

  
});

module.exports = buildUserConfigSchema;