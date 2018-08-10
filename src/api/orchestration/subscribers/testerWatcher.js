const redis = require('redis');

let log;
let redisOptions;
const subscribers = {};

const subscribe = (redisChannel, callback) => {
  subscribers[redisChannel] = redis.createClient(redisOptions);
  subscribers[redisChannel].subscribe(redisChannel);

  subscribers[redisChannel].on('error', (error) => {
    log.error(`Redis error: ${error}`);
  });

  subscribers[redisChannel].on('message', callback);
};


const init = (options) => {
  log = options.log; // eslint-disable-line prefer-destructuring
  redisOptions = options.redis;

  return { subscribe };
};


module.exports = {
  init,
  subscribe
};
