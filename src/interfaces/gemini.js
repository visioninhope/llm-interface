/**
 * @file interfaces/gemini.js
 * @class Gemini
 * @description Wrapper class for the Gemini API.
 * @param {string} apiKey - The API key for the Gemini API.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getFromCache, saveToCache } = require('../utils/cache');
const { returnMessageObject, returnModelByAlias } = require('../utils/utils');
const { geminiApiKey } = require('../config/config');
const config = require('../config/llm-providers.json');
const log = require('loglevel');

// Gemini class for interacting with the Gemini API
class Gemini {
  /**
   * Constructor for the Gemini class.
   * @param {string} apiKey - The API key for the Gemini API.
   */
  constructor(apiKey) {
    this.interfaceName = 'gemini';
    this.apiKey = apiKey || geminiApiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Convert the input data structure to the format expected by the Gemini API.
   * @param {object} input - The input message object.
   * @param {number} maxTokens - The maximum number of tokens for the response.
   * @param {string} responseFormat - The format of the response ("text" or "json_object").
   * @param {object} generationConfigOptions - Additional options for the generation config.
   * @returns {object} The converted data structure.
   */
  convertDataStructure(
    input,
    maxTokens,
    responseFormat,
    generationConfigOptions = {},
  ) {
    let history = input.messages.slice(0, -1).map((message) => ({
      role: message.role,
      parts: [{ text: message.content }],
    }));
    if (history.length > 0 && history[0].role !== 'user') {
      history[0].role = 'user';
    }
    const prompt = input.messages[input.messages.length - 1].content;
    const responseMimeType =
      responseFormat === 'json_object' ? 'application/json' : 'text/plain';
    const generationConfig = {
      ...generationConfigOptions,
      maxOutputTokens: maxTokens,
      ...(responseFormat && { responseMimeType: responseMimeType }),
    };
    return { history, prompt, generationConfig };
  }

  /**
   * Send a message to the Gemini API.
   * @param {string|object} message - The message to send or a message object.
   * @param {object} options - Additional options for the API request.
   * @param {object} interfaceOptions - Options specific to the interface.
   * @returns {string|object} The response content from the Gemini API.
   */
  async sendMessage(message, options = {}, interfaceOptions = {}) {
    const messageObject =
      typeof message === 'string' ? returnMessageObject(message) : message;
    const cacheTimeoutSeconds =
      typeof interfaceOptions === 'number'
        ? interfaceOptions
        : interfaceOptions.cacheTimeoutSeconds;

    let { model } = messageObject;
    const selectedModel = returnModelByAlias(this.interfaceName, model);
    let { max_tokens = 150, response_format = 'text/plain' } = options;

    // Set the model and default values
    model =
      selectedModel ||
      options.model ||
      config[this.interfaceName].model.default.name;
    const { history, prompt, generationConfig } = this.convertDataStructure(
      messageObject,
      max_tokens,
      response_format,
      {
        temperature: options.temperature || 0.9,
        topP: options.topP || 1,
        topK: options.topK || 1,
      },
    );

    // Generate a cache key based on the input data
    const cacheKey = JSON.stringify({
      model,
      history,
      prompt,
      generationConfig,
    });
    if (cacheTimeoutSeconds) {
      const cachedResponse = getFromCache(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Set up retry mechanism with exponential backoff
    let retryAttempts = interfaceOptions.retryAttempts || 0;
    let currentRetry = 0;
    while (retryAttempts >= 0) {
      try {
        // Get the generative model instance for the selected model
        const modelInstance = this.genAI.getGenerativeModel({ model });
        // Start a chat session with the model
        const chat = modelInstance.startChat({ history, generationConfig });
        // Send the prompt to the model
        const result = await chat.sendMessage(prompt);
        // Get the response from the model
        const response = await result.response;
        let text = await response.text();

        if (response_format === 'json_object') {
          try {
            // Parse the response as JSON if requested
            text = JSON.parse(text);
          } catch (e) {
            text = null;
          }
        }

        if (cacheTimeoutSeconds && text) {
          saveToCache(cacheKey, text, cacheTimeoutSeconds);
        }

        return text;
      } catch (error) {
        retryAttempts--;
        if (retryAttempts < 0) {
          log.error(
            'Response data:',
            error.response ? error.response.data : null,
          );
          throw error;
        }

        // Calculate the delay for the next retry attempt
        let retryMultiplier = interfaceOptions.retryMultiplier || 0.3;
        const delay = (currentRetry + 1) * retryMultiplier * 1000;

        await new Promise((resolve) => setTimeout(resolve, delay));
        currentRetry++;
      }
    }
  }
}

module.exports = Gemini;
