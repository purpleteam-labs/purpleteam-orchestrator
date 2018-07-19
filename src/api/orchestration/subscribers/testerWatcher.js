const redis = require('redis');

let log;
const subscribers = {};

const init = (options) => {
  log = options.log;  
  options.channels.forEach((channel) => {
    subscribers[channel] = redis.createClient(options.redis);
  });
  return {subscribe};
};


const subscribe = (redisChannel, callback) => {
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