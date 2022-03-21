// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import Joi from 'joi';
import config from '../../../../config/config.js';

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

export default validateTesterNameSessionId;

