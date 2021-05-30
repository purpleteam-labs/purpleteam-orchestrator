// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of purpleteam.

// purpleteam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// purpleteam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with purpleteam. If not, see <https://www.gnu.org/licenses/>.

const jsdiff = require('diff');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const Bourne = require('@hapi/bourne');

const ajv = new Ajv({ allErrors: true, useDefaults: true, removeAdditional: true });
addFormats(ajv);

// Todo: KC: Make error messages more meaningful.
require('ajv-errors')(ajv);

const config = require('config/config');

const configSchemaProps = config.getSchema()._cvtProperties; // eslint-disable-line no-underscore-dangle

const log = require('purpleteam-logger').init(config.get('logger'));

// Used quicktype to generate initial schema from buildUserConfig
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
        version: { type: 'string', const: config.get('buildUserConfig.version') },
        sutAuthentication: { $ref: '#/definitions/SutAuthentication' },
        sutIp: { type: 'string', oneOf: [{ format: 'ipv6' }, { format: 'hostname' }] }, // https://github.com/epoberezkin/ajv/issues/832
        sutPort: { type: 'integer', minimum: 1, maximum: 65535 },
        sutProtocol: { type: 'string', enum: ['https', 'http'], default: 'https' },
        browser: { type: 'string', enum: configSchemaProps.sut._cvtProperties.browser.format, default: config.get('sut.browser') }, // eslint-disable-line no-underscore-dangle
        loggedInIndicator: { type: 'string', minLength: 1 },
        reportFormats: {
          type: 'array',
          items: {
            type: 'string',
            enum: configSchemaProps.sut._cvtProperties.reportFormat.format // eslint-disable-line no-underscore-dangle
          },
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
      errorMessage: { properties: { loggedInIndicator: 'A loggedInIndicator is required by the App emissary in order to know if a login was successful' } }
    },
    SutAuthentication: {
      type: 'object',
      additionalProperties: false,
      properties: {
        route: { type: 'string', pattern: '^/\\w{1,200}$' },
        usernameFieldLocater: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,100}$' }, // Possibly allow spaces for css selectors.
        passwordFieldLocater: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,100}$' }, // Possibly allow spaces for css selectors.
        submit: { type: 'string', pattern: '^[a-zA-Z0-9_\\-\\s]{1,100}$' },
        expectedPageSourceSuccess: { type: 'string', minLength: 2, maxLength: 200 }
      },
      required: [
        'passwordFieldLocater',
        'route',
        'submit',
        'usernameFieldLocater',
        'expectedPageSourceSuccess'
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
        type: { type: 'string', enum: ['testSession', 'route'] },
        id: { type: 'string' }
      },
      required: ['id', 'type'],
      if: { properties: { type: { enum: ['testSession'] } } },
      then: { properties: { id: { type: 'string', pattern: '^\\w{1,200}$' } } },
      else: {
        if: { properties: { type: { enum: ['route'] } } },
        then: { properties: { id: { type: 'string', pattern: '^/\\w{1,200}$' } } }
      },
      title: 'ResourceLinkage'
    },
    TopLevelResourceObject: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['testSession', 'route'] },
        id: { type: 'string' },
        attributes: {},
        relationships: {}
      },
      required: [
        'attributes',
        'id',
        'type'
      ],
      // If we want to use flags for regex, etc, then need to use ajv-keywords: https://github.com/epoberezkin/ajv-keywords#regexp
      if: { properties: { type: { enum: ['testSession'] } } },
      then: {
        properties: {
          id: { type: 'string', pattern: '^\\w{1,200}$' },
          attributes: { $ref: '#/definitions/AttributesObjOfTopLevelResourceObjectOfTypeTestSession' },
          relationships: { $ref: '#/definitions/Relationships' }
        },
        required: ['relationships']
      },
      else: {
        if: { properties: { type: { enum: ['route'] } } },
        then: {
          properties: {
            id: { type: 'string', pattern: '^/\\w{1,200}$' },
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
        username: { type: 'string', pattern: '^[a-zA-Z0-9_\\-]{1,100}$' },
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
        submit: { type: 'string', pattern: '^[a-zA-Z0-9_\\-\\s]{1,100}$' }
      },
      required: ['attackFields', 'method', 'submit'],
      title: 'AttributesObjOfTopLevelResourceObjectOfTypeRoute'
    },

    AttackField: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', pattern: '^[a-zA-Z0-9_\\-]{1,100}$' },
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
const convertJsonToObj = (value) => ((typeof value === 'string' || value instanceof String) ? Bourne.parse(value) : value);
const deltaLogs = (initialConfig, possiblyMutatedConfig) => {
  const deltas = jsdiff.diffJson(convertJsonToObj(initialConfig), convertJsonToObj(possiblyMutatedConfig));
  const additionLogs = deltas.filter((d) => d.added).map((cV) => `Added -> ${cV.value}`);
  const subtractionsLogs = deltas.filter((d) => d.removed).map((cV) => `Removed -> ${cV.value}`);
  return [...additionLogs, ...subtractionsLogs];
};

const logDeltaLogs = (logItems) => {
  log.notice('As part of the route validation, the following changes were made to the buildUserConfig:');
  logItems.length ? logItems.forEach((logItem) => { log.notice(logItem, { tags: ['buildUserConfig'] }); }) : log.notice('no changes', { tags: ['buildUserConfig'] });
};

// hapi route.options.validate.payload expects no return value if all good, but a value if mutation occurred.
// eslint-disable-next-line consistent-return
const validateBuildUserConfig = async (serialisedBuildUserConfig) => {
  const buildUserConfig = convertJsonToObj(serialisedBuildUserConfig);

  // Todo: Kim C: Will need to test various configs.
  if (!validate(buildUserConfig)) {
    const validationError = new Error(JSON.stringify(validate.errors, null, 2));
    validationError.name = 'ValidationError';
    throw validationError;
  }

  const possiblyMutatedSerialisedBuildUserConfig = JSON.stringify(buildUserConfig, null, 2);
  // Todo: Kim C: Will need to test various configs.
  const logItems = deltaLogs(serialisedBuildUserConfig, possiblyMutatedSerialisedBuildUserConfig);
  logDeltaLogs(logItems);
  if (logItems.length) return possiblyMutatedSerialisedBuildUserConfig;
};


module.exports = validateBuildUserConfig;
