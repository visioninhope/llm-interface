/**
 * @file src/interfaces/writer.js
 * @class Writer
 * @description Wrapper class for the Writer API.
 * @param {string} apiKey - The API key for the Writer API.
 */

const BaseInterface = require('./baseInterface.js');
const { writerApiKey } = require('../utils/loadApiKeysFromEnv.js');
const { getConfig, loadProviderConfig } = require('../utils/configManager.js');

const interfaceName = 'writer';

loadProviderConfig(interfaceName);
const config = getConfig();

class Writer extends BaseInterface {
  constructor(apiKey) {
    super(interfaceName, apiKey || writerApiKey, config[interfaceName].url);
  }

  /**
   * Method to update the message object if needed.
   * Converts messages to the format expected by the Anthropic API.
   * @param {object} messageObject - The message object to be updated.
   * @returns {object} The updated message object.
   */
  updateMessageObject(messageObject) {
    let { messages } = messageObject;

    // Remove the specific 'system' message if it is the first message
    if (
      messages[0].role === 'system' &&
      messages[0].content === 'You are a helpful assistant.'
    ) {
      messages.shift();
    }

    // If the first message's role is 'system', prepend a user message
    if (messages[0] && messages[0].role === 'system') {
      messages.unshift({ role: 'user', content: 'Hello!' });
    }

    // Ensure the sequence alternates between 'user' and 'assistant', starting with 'user'
    const convertedMessages = messages.map((msg, index) => {
      if (index % 2 === 0) {
        return { ...msg, role: 'user' };
      } else {
        return { ...msg, role: 'assistant' };
      }
    });

    return {
      ...messageObject,
      messages: convertedMessages,
    };
  }
}

module.exports = Writer;
