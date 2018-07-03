const Joi = require('joi');
const config = require('config/config');
const configSchemaProps = config.getSchema().properties;


const internals = {
  countOfTestSessions: 0,
  countOfUniqueRoutes: 0
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

  return Joi.array().items(...duplicateSchemaItems(internals.countOfTestSessions, testSessionSchema), ...duplicateSchemaItems(internals.countOfUniqueRoutes, routeSchema));

};


const hydrateAndCountTestSessions = (serialisedBuildUserConfig) => {  
  const buildUserConfig = JSON.parse(serialisedBuildUserConfig);
  let testSessions;
  try {
    testSessions = buildUserConfig.included.filter(element => element.type === 'testSession');
    const isTestSessions = {
      'false': () => { throw new SyntaxError('The supplied build user config had no testSession(s)') },
      'true': () => { internals.countOfTestSessions = testSessions.length; }
    };
    isTestSessions[!!testSessions.length]();
  } catch(e) {
    if (e.message === 'Cannot read property \'filter\' of undefined') {
      let validationError = new Error('child "included" fails becuase ["included" is required]');
      validationError.name = 'ValidationError';
      throw validationError;
    }
    if (e instanceof SyntaxError) throw e;
  }  
  return testSessions;
};


const hydrateAndCountUniqueRouteResourceIdentifiers = (testSessions) => {
  let routeResourceIdentifierObjects = [];
  const isRouteResourceIdentifierObjectsPerTestSession = {
    'false': () => {
      throw new SyntaxError('child "included" fails becuase ["testSession" fails because ["relationships" fails becuase [data has no elements of "type" "route"]]]')
    },
    'true': (routeResourceIdentifierObjectsPerTestSession) => {
      routeResourceIdentifierObjects.push(...routeResourceIdentifierObjectsPerTestSession);
    }
  };
  testSessions.forEach((current) => {
    debugger;
    let routeResourceIdentifierObjectsPerTestSession = [];
    try {
      routeResourceIdentifierObjectsPerTestSession.push(...current.relationships.data.filter(element => element.type === 'route'));
      isRouteResourceIdentifierObjectsPerTestSession[!!routeResourceIdentifierObjectsPerTestSession.length](routeResourceIdentifierObjectsPerTestSession);

    }
    catch (e) {
      debugger
      if (e.message === 'Cannot read property \'data\' of undefined') throw new SyntaxError('child "included" fails because ["testSession" fails becuase ["relationships" is missing]]');
      if (e.message === 'Cannot read property \'filter\' of undefined') throw new SyntaxError('child "included" fails because ["testSession" fails becuase ["relationships" fails becuase ["data" is missing]]]');
      
      debugger
    }

  });

  internals.countOfUniqueRoutes = [...(new Set(routeResourceIdentifierObjects.map(item => item.id)))].length;
};


const buildUserConfigSchema = serialisedBuildUserConfig => {
  debugger;
  const testSessions = hydrateAndCountTestSessions(serialisedBuildUserConfig);
  hydrateAndCountUniqueRouteResourceIdentifiers(testSessions);
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