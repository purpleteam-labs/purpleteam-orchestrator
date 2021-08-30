// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of PurpleTeam.

// PurpleTeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// PurpleTeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with PurpleTeam. If not, see <https://www.gnu.org/licenses/>.

const Joi = require('joi');
const config = require('config/config');

const testers = Object.keys(config.getProperties().testers);

const testerNameSessionIdSchema = Joi.object({
  testerName: Joi.string().valid(...testers).required(),
  sessionId: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required()
});

const validateTesterNameSessionId = (params) => {
  const { error, value } = testerNameSessionIdSchema.validate(params);
  if (error) {
    const validationError = new Error(error.message);
    validationError.name = error.name;
    throw validationError;
  }
  return value;
};
module.exports = { validateTesterNameSessionId };
