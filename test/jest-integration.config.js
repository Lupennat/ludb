const jest = require('./jest.config');

module.exports = Object.assign({}, jest, {
    setupFilesAfterEnv: ['<rootDir>/test/jest-integration.setup.ts']
});
