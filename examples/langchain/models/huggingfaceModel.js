const { LLMInterface } = require('../../../src/index.js');

class HuggingFaceModel {
  constructor(apiKey, cache = false) {
    this.apiKey = apiKey;
    this.interfaceName = 'huggingface';
    this.outputParser = null; // Initialize outputParser as null
    this.interfaceOptions = { retryAttempts: 3 };

    if (cache) {
      this.interfaceOptions.cacheTimeoutSeconds = this.cache;
    }
  }

  /**
   * Generate text using the Hugging Face model.
   * @param {object} inputs - The input object containing the simplePrompt.
   * @param {object} options - Options for text generation, such as max_tokens.
   * @returns {string} The generated text.
   */
  async call(simplePrompt, options = { max_tokens: 1024, model: 'default' }) {
    const response = await LLMInterface.sendMessage(
      [this.interfaceName, this.apiKey],
      simplePrompt,
      options,
      this.interfaceOptions,
    );

    // Assume response.results contains the generated text
    let generatedText = response.results;

    // If an output parser is set, process the generated text with it
    if (this.outputParser && typeof this.outputParser.parse === 'function') {
      generatedText = this.outputParser.parse(generatedText);
    }

    return generatedText;
  }

  /**
   * Embeds an array of texts using the LLMInterface.
   *
   * @param {string[]} texts - The array of texts to embed.
   * @param {Object} [options={}] - Optional parameters for embedding.
   * @returns {Promise<Array>} - A promise that resolves to an array of embeddings.
   */
  async embed(texts, options = {}) {
    const responses = await Promise.all(
      texts.map(async (text) => {
        const response = await LLMInterface.embeddings(
          [this.interfaceName, this.apiKey],
          text,
          options,
          this.interfaceOptions,
        );

        return response.results;
      }),
    );
    return responses;
  }

  /**
   * Embeds a single query using the LLMInterface.
   *
   * @param {string} query - The query to embed.
   * @param {Object} [options={}] - Optional parameters for embedding.
   * @returns {Promise<Array>} - A promise that resolves to the embedding of the query.
   */
  async embedQuery(query, options = {}) {
    const response = await LLMInterface.embeddings(
      [this.interfaceName, this.apiKey],
      query,
      options,
      this.interfaceOptions,
    );

    return response.results;
  }

  /**
   * Attach an output parser to process the generated text.
   * @param {object} outputParser - The parser object with a `parse` method.
   * @returns {HuggingFaceModel} The current instance for method chaining.
   */
  pipe(outputParser) {
    this.outputParser = outputParser;
    return this; // Allow method chaining
  }

  /**
   * Invoke method required by langchain.
   * @param {object} inputs - The input object containing the simplePrompt.
   * @param {object} runManager - An optional run manager object.
   * @returns {string} The generated text.
   */
  async invoke(inputs, runManager) {
    const simplePrompt = inputs.value;
    return this.call(simplePrompt);
  }

  /**
   * Get the model type.
   * @returns {string} The model type string.
   */
  _modelType() {
    return LLMInterface.getInterfaceConfigValue(
      this.interfaceName,
      'model.default',
    );
  }
}

module.exports = HuggingFaceModel;
