/**
 * @file test/simple/gemini.test.js
 * @description Simplified tests for the Gemini API client.
 */

const Gemini = require('../../src/interfaces/gemini.js');
const { geminiApiKey } = require('../../src/config/config.js');
const {
  simplePrompt,
  options,
  expectedMaxLength,
} = require('../utils/defaults.js');
describe('Gemini Simple', () => {
  if (geminiApiKey) {
    let response;
    test('API Key should be set', async () => {
      expect(typeof geminiApiKey).toBe('string');
    });

    test('API Client should send a message and receive a response', async () => {
      const gemini = new Gemini(geminiApiKey);

      response = await gemini.sendMessage(simplePrompt, options);

      expect(typeof response).toBe('string');
    });
    test(`Response should be less than ${expectedMaxLength} characters`, async () => {
      expect(response.length).toBeLessThan(expectedMaxLength);
    });
  } else {
    test.skip(`API Key is not set`, () => {});
  }
});
