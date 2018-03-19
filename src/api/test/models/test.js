class Test {
  initialise(config) {
    this.config = config;
    console.log(`In the test model's initialise method. The config is: "${this.config}"`); // eslint-disable-line no-console
  }
}

module.exports = Test;
