const jsdiff = require('diff');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, useDefaults: true, removeAdditional: true });

// Todo: KC: Make error messages more meaningful.
require('ajv-errors')(ajv);

const config = require('config/config');
const configSchemaProps = config.getSchema().properties;

const log = require('purpleteam-logger').init(config.get('logger'));


const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $ref: '#/definitions/BuildUserConfig',
  definitions: {
    BuildUserConfig: {
      type: 'object',
      additionalProperties: false,
      properties: {
        data: { $ref: '#/definitions/Data' },
        included: {
          type: 'array',
          items: { $ref: '#/definitions/TopLevelResourceObject' }
        }
      },
      required: [
        'data',
        'included'
      ],
      title: 'BuildUserConfig'
    },
    Data: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['testRun'] },
        attributes: { $ref: '#/definitions/DataAttributes' },
        relationships: { $ref: '#/definitions/Relationships' }
      },
      required: [
        'attributes',
        'relationships',
        'type'
      ],
      title: 'Data'
    },
    DataAttributes: {
      type: 'object',
      additionalProperties: false,
      properties: {
        version: { type: 'string', pattern: '^([0-9]|[1-9][0-9]*)\\.([0-9]|[1-9][0-9]*)\\.([0-9]|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?(?:\\+[0-9A-Za-z-]+)?$' },
        sutAuthentication: { $ref: '#/definitions/SutAuthentication' },
        sutIp: { type: 'string', oneOf: [{ format: 'ipv6' }, { format: 'hostname' }] }, // https://github.com/epoberezkin/ajv/issues/832
        sutPort: { type: 'integer', minimum: 1, maximum: 65535 },
        sutProtocol: { type: 'string', enum: ['https', 'http'], default: 'https' },
        browser: { type: 'string', enum: configSchemaProps.sut.properties.browser.format, default: config.get('sut.browser') },
        loggedInIndicator: { type: 'string', minLength: 1 },
        reportFormats: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['html', 'json', 'md']
          },
          additionalItems: false,
          uniqueItems: true,
          minItems: 1
        }
      },
      required: [
        'browser',
        'loggedInIndicator',
        'reportFormats',
        'sutAuthentication',
        'sutIp',
        'sutPort',
        'sutProtocol',
        'version'
      ],
      title: 'DataAttributes',
      errorMessage: { properties: { loggedInIndicator: 'A loggedInIndicator is required by the App slave in order to know if a login was successful' } }
    },
    SutAuthentication: {
      type: 'object',
      additionalProperties: false,
      properties: {
        route: { type: 'string', pattern: '^/\\w{1,200}$' },
        usernameFieldLocater: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,100}$' }, // Posibly allow spaces for css selectors.
        passwordFieldLocater: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,100}$' }, // Posibly allow spaces for css selectors.
        submit: { type: 'string', pattern: '^[a-zA-Z0-9_-\\s]{1,100}$' },
        expectedResponseSuccess: { type: 'string' },
        expectedResponseFail: { type: 'string' }
      },
      oneOf: [
        {
          required: [
            'expectedResponseSuccess'
          ]
        }, {
          required: [
            'expectedResponseFail'
          ]
        }
      ],
      required: [
        'passwordFieldLocater',
        'route',
        'submit',
        'usernameFieldLocater'
      ],
      title: 'SutAuthentication'
    },
    Relationships: {
      type: 'object',
      additionalProperties: false,
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/definitions/ResourceLinkage' }
        }
      },
      required: [
        'data'
      ],
      title: 'Relationships'
    },
    ResourceLinkage: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string' },
        id: { type: 'string' }
      },
      required: [
        'id',
        'type'
      ],
      title: 'ResourceLinkage'
    },
    TopLevelResourceObject: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['testSession', 'route'] },
        id: { type: 'string' },
        attributes: {},
        relationships: { $ref: '#/definitions/Relationships' }
      },
      required: [
        'attributes',
        'id',
        'type'
      ],
      // If we want to use flags, etc, then need to use ajv-keywords: https://github.com/epoberezkin/ajv-keywords#regexp
      if: { properties: { type: { enum: ['testSession'] } } },
      then: {
        properties: {
          id: { pattern: '^\\w{1,200}$' },
          attributes: { $ref: '#/definitions/AttributesObjOfTopLevelResourceObjectOfTypeTestSession' }
        }
      },
      else: {
        if: { properties: { type: { enum: ['route'] } } },
        then: {
          properties: {
            id: { pattern: '^/\\w{1,200}$' },
            attributes: { $ref: '#/definitions/AttributesObjOfTopLevelResourceObjectOfTypeRoute' }
          }
        }
      },
      title: 'TopLevelResourceObject',
      errorMessage: {
        properties: {
          type: 'should be one of either testSession or route',
          id: 'if type is testSession, the id should be a valid testSession, if type is route, the id should be a valid route'
        }
      }
    },

    AttributesObjOfTopLevelResourceObjectOfTypeTestSession: {
      type: 'object',
      additionalProperties: false,
      properties: {
        username: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,100}$' },
        password: { type: 'string' },
        aScannerAttackStrength: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'INSANE'] },
        aScannerAlertThreshold: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        alertThreshold: { type: 'integer' }
      },
      required: [],
      title: 'AttributesObjOfTopLevelResourceObjectOfTypeTestSession'
    },

    AttributesObjOfTopLevelResourceObjectOfTypeRoute: {
      type: 'object',
      additionalProperties: false,
      properties: {
        attackFields: {
          type: 'array',
          items: { $ref: '#/definitions/AttackField' },
          uniqueItems: true,
          minItems: 0
        },
        method: { type: 'string', enum: ['GET', 'PUT', 'POST'] },
        submit: { type: 'string', pattern: '^[a-zA-Z0-9_-\\s]{1,100}$' }
      },
      required: ['attackFields', 'method', 'submit'],
      title: 'AttributesObjOfTopLevelResourceObjectOfTypeRoute'
    },

    AttackField: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,100}$' },
        value: { type: 'string' },
        visible: { type: 'boolean' } // Todo: KC: Need to check whether visible should be required.
      },
      required: [
        'name',
        'value'
      ],
      title: 'AttackField'
    }
  }
};

const validate = ajv.compile(schema);

// hapi route.options.validate.payload expects no return value if all good, but a value if mutation occured.
// eslint-disable-next-line consistent-return
const buildUserConfigSchema = async (serialisedBuildUserConfig) => {
  const buildUserConfig = (typeof serialisedBuildUserConfig === 'string' || serialisedBuildUserConfig instanceof String) ? JSON.parse(serialisedBuildUserConfig) : serialisedBuildUserConfig;
  const valid = validate(buildUserConfig);

  const mutatedSerialisedBuildUserConfig = JSON.stringify(buildUserConfig, null, 2);
  const diff = jsdiff.diffJson(JSON.parse(serialisedBuildUserConfig), JSON.parse(mutatedSerialisedBuildUserConfig));
  let mutated = false;
  diff.forEach((part) => {
    if (part.added) {
      mutated = true;
      log.notice(`Added ->${part.value}}`, { tags: ['buildUserConfig'] });
    }
    if (part.removed) {
      mutated = true;
      log.notice(`Removed ->${part.value}}`, { tags: ['buildUserConfig'] });
    }
  });

  if (!valid) {
    const validationError = new Error(JSON.stringify(validate.errors, null, 2));
    validationError.name = 'ValidationError';
    throw validationError;
  }

  if (mutated) return mutatedSerialisedBuildUserConfig;
};


module.exports = buildUserConfigSchema;
