const Joi = require('joi');
const config = require('config/config');
const testers = Object.keys(config.getProperties().testers);

const internals = {};

const namesSchema = Joi.object({
  testerName: Joi.string().valid(testers)
});

const testerNames = (params) => {
  return Joi.validate(params, namesSchema)
};

module.exports = {
  testerNames
};
