const Joi = require('joi');
const config = require('config/config');

const configSchemaProps = config.getSchema().properties;

const internals = {
  countOfTestSessions: 0,
  countOfUniqueRoutes: 0
};


const includedSchema = () => {
  const testSessionSchema = Joi.object({
    type: Joi.string().required().valid('testSession'),
    id: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required(),
    attributes: Joi.object({
      username: Joi.string().required().min(2),
      password: Joi.string().required().min(2),
      // Sourced from app-scanner config
      aScannerAttackStrength: Joi.string().valid(['LOW', 'MEDIUM', 'HIGH', 'INSANE']),
      aScannerAlertThreshold: Joi.string().valid(['LOW', 'MEDIUM', 'HIGH']),
      alertThreshold: Joi.number().integer()
    }),
    relationships: Joi.object({
      data: Joi.array().items(Joi.object({
        type: Joi.string().required().valid('route'),
        id: Joi.string().required().min(2).regex(/^\/[a-z]+/i)
      })) // Could be many of these.
    }).required()
  }).required();

  const routeSchema = Joi.object({
    type: Joi.string().required().valid('route'),
    id: Joi.string().required().min(2).regex(/^\/[a-z]+/i),
    attributes: Joi.object({
      attackFields: Joi.array().min(0).items(Joi.object({
        name: Joi.string().required(),
        value: Joi.string().allow(''),
        visible: Joi.boolean()
      }).optionalKeys('visible')),
      method: Joi.string().valid(['GET', 'PUT', 'POST']),
      submit: Joi.string()
    })
  }).required();

  const duplicateSchemaItems = (itemCount, schema, accumulator) => {
    const a = accumulator || [];
    if (itemCount) {
      a.push(schema);
      duplicateSchemaItems(itemCount - 1, schema, a);
    }
    return a;
  };

  const items = [
    ...duplicateSchemaItems(internals.countOfTestSessions, testSessionSchema),
    ...duplicateSchemaItems(internals.countOfUniqueRoutes, routeSchema)
  ];
  return Joi.array().items(...items).length(items.length);//.error(() => `one or more of the resource objects appear to be invalid. Check their syntax and structure`);
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
  included: Joi.lazy(includedSchema)/*.required().Joi.array().items(
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


const hydrateAndCountTestSessions = (serialisedBuildUserConfig) => {
  const buildUserConfig = JSON.parse(serialisedBuildUserConfig);
  let testSessions;
  try {
    testSessions = buildUserConfig.included.filter(element => element.type === 'testSession');
    const isTestSessions = {
      false: () => {
        const validationError = new Error('child "included" fails because [at least one "testSession" is required]');
        validationError.name = 'ValidationError';
        throw validationError;
      },
      true: () => { internals.countOfTestSessions = testSessions.length; }
    };
    isTestSessions[!!testSessions.length]();
  } catch (e) {
    if (e.message === 'Cannot read property \'filter\' of undefined') {
      const validationError = new Error('child "included" fails becuase ["included" is required]');
      validationError.name = 'ValidationError';
      throw validationError;
    }
    throw e;
  }
  return testSessions;
};


const hydrateAndCountUniqueRouteResourceIdentifiers = (testSessions) => {
  const routeResourceIdentifierObjects = [];
  const isRouteResourceIdentifierObjectsPerTestSession = {
    false: () => {
      const validationError = new Error('child "included" fails becuase ["testSession" fails because ["relationships" fails becuase [data has no elements of "type" "route"]]]');
      validationError.name = 'ValidationError';
      throw validationError;
    },
    true: (routeResourceIdentifierObjectsPerTestSession) => {
      routeResourceIdentifierObjects.push(...routeResourceIdentifierObjectsPerTestSession);
    }
  };
  testSessions.forEach((current) => {
    const routeResourceIdentifierObjectsPerTestSession = [];
    try {
      routeResourceIdentifierObjectsPerTestSession.push(...current.relationships.data.filter(element => element.type === 'route'));
      isRouteResourceIdentifierObjectsPerTestSession[!!routeResourceIdentifierObjectsPerTestSession.length](routeResourceIdentifierObjectsPerTestSession);
    } catch (e) {
      if (e.message === 'Cannot read property \'data\' of undefined') {
        const validationError = new Error('child "included" fails because ["testSession" fails becuase ["relationships" is missing]]');
        validationError.name = 'ValidationError';
        throw validationError;
      }
      if (e.message === 'Cannot read property \'filter\' of undefined') {
        const validationError = new Error('child "included" fails because ["testSession" fails becuase ["relationships" fails becuase ["data" is missing]]]');
        validationError.name = 'ValidationError';
        throw validationError;
      }
      throw e;
    }
  });
  internals.countOfUniqueRoutes = [...(new Set(routeResourceIdentifierObjects.map(item => item.id)))].length;
};


const buildUserConfigSchema = (serialisedBuildUserConfig) => {
  const testSessions = hydrateAndCountTestSessions(serialisedBuildUserConfig);
  hydrateAndCountUniqueRouteResourceIdentifiers(testSessions);
  return Joi.validate(serialisedBuildUserConfig, schema);
};


module.exports = buildUserConfigSchema;
