const Ajv = require('ajv');
const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}


const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/BuildUserConfig",
  "definitions": {
      "BuildUserConfig": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
              "data": {
                  "$ref": "#/definitions/Data"
              },
              "included": {
                  "type": "array",
                  "items": {
                      "$ref": "#/definitions/Included"
                  }
              }
          },
          "required": [
              "data",
              "included"
          ],
          "title": "BuildUserConfig"
      },
      "Data": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
              "type": {
                  "type": "string"
              },
              "attributes": {
                  "$ref": "#/definitions/DataAttributes"
              },
              "relationships": {
                  "$ref": "#/definitions/Relationships"
              }
          },
          "required": [
              "attributes",
              "relationships",
              "type"
          ],
          "title": "Data"
      },
      "DataAttributes": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
              "version": {
                  "type": "string"
              },
              "sutAuthentication": {
                  "$ref": "#/definitions/SutAuthentication"
              },
              "sutIp": {
                  "type": "string"
              },
              "sutPort": {
                  "type": "integer"
                  
              },
              "sutProtocol": {
                  "type": "string"
              },
              "browser": {
                  "type": "string"
              },
              "loggedInIndicator": {
                  "type": "string"
              },
              "reportFormats": {
                  "type": "array",
                  "items": {
                      "type": "string"
                  }
              }
          },
          "required": [
              "browser",
              "loggedInIndicator",
              "reportFormats",
              "sutAuthentication",
              "sutIp",
              "sutPort",
              "sutProtocol",
              "version"
          ],
          "title": "DataAttributes"
      },
      "SutAuthentication": {
          "type": "object",
          "additionalProperties": true,
          "properties": {
              "route": {
                  "type": "string"
              },
              "usernameFieldLocater": {
                  "type": "string"
              },
              "passwordFieldLocater": {
                  "type": "string"
              },
              "submit": {
                  "type": "string"
              },
              "expectedResponseSuccess": {
                "type": "string"
              },
              "expectedResponseFail": {
                "type": "string"
              }  
          },
          oneOf: [
            {
              required: [
                "expectedResponseSuccess"
              ],
            }, {
              required: [
                "expectedResponseFail"
              ]
            }
          ],
          "required": [
              "passwordFieldLocater",
              "route",
              "submit",
              "usernameFieldLocater"
          ],
          "title": "SutAuthentication"
      },
      "Relationships": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
              "data": {
                  "type": "array",
                  "items": {
                      "$ref": "#/definitions/Datum"
                  }
              }
          },
          "required": [
              "data"
          ],
          "title": "Relationships"
      },
      "Datum": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
              "type": {
                  "type": "string"
              },
              "id": {
                  "type": "string"
              }
          },
          "required": [
              "id",
              "type"
          ],
          "title": "Datum"
      },
      "Included": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
              "type": {
                  "type": "string"
              },
              "id": {
                  "type": "string"
              },
              "attributes": {
                  "$ref": "#/definitions/IncludedAttributes"
              },
              "relationships": {
                  "$ref": "#/definitions/Relationships"
              }
          },
          "required": [
              "attributes",
              "id",
              "type"
          ],
          "title": "Included"
      },
      "IncludedAttributes": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
              "username": {
                  "type": "string"
              },
              "password": {
                  "type": "string"
              },
              "aScannerAttackStrength": {
                  "type": "string"
              },
              "aScannerAlertThreshold": {
                  "type": "string"
              },
              "alertThreshold": {
                  "type": "integer"
              },
              "attackFields": {
                  "type": "array",
                  "items": {
                      "$ref": "#/definitions/AttackField"
                  }
              },
              "method": {
                  "type": "string"
              },
              "submit": {
                  "type": "string"
              }
          },
          "required": [],
          "title": "IncludedAttributes"
      },
      "AttackField": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
              "name": {
                  "type": "string"
              },
              "value": {
                  "type": "string"
              },
              "visible": {
                  "type": "boolean"
              }
          },
          "required": [
              "name",
              "value"
          ],
          "title": "AttackField"
      }
  }
};

const validate = ajv.compile(schema);


const buildUserConfigSchema = async (serialisedBuildUserConfig) => {
  debugger;
  const buildUserConfig = (typeof serialisedBuildUserConfig === 'string' || serialisedBuildUserConfig instanceof String) ? JSON.parse(serialisedBuildUserConfig) : serialisedBuildUserConfig;  
  const validBuildUserConfig = validate(buildUserConfig);
  if (!validBuildUserConfig) {
    const validationError = new Error(JSON.stringify(validate.errors, null, 2));
    validationError.name = 'ValidationError';
    throw validationError;
  }  
};


module.exports = buildUserConfigSchema;
