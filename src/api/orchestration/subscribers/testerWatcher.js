const redis = require('redis');

let log;
let redisOptions;
const subscribers = {};

const init = (options) => {
  log = options.log;
  redisOptions = options.redis;
/*
  options.baseChannels.forEach((channel) => {
    subscribers[channel] = redis.createClient(options.redis);
  });
*/
  return {subscribe};
};


const subscribe = (redisChannel, callback) => {
  subscribers[redisChannel] = redis.createClient(redisOptions);
  subscribers[redisChannel].subscribe(redisChannel);
  
  subscribers[redisChannel].on('error', (error) => {
    log.error(`Redis error: ${error}`);
  });

  subscribers[redisChannel].on('message', callback);
};


module.exports = {
  init,
  subscribe
};
