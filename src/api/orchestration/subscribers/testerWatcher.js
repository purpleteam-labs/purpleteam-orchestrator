const redis = require('redis');

let log;
let subscriber;

const init = (options) => {
  log = options.log
  subscriber = redis.createClient(options.redis);
  return {subscribe};
};


const subscribe = (redisChannel, callback) => {  
  subscriber.subscribe(redisChannel);
  
  subscriber.on('error', (error) => {
    log.error(`Redis error: ${error}`);
  });

  subscriber.on('message', callback);
};


module.exports = {
  init,
  subscribe
};