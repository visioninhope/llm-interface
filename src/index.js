/**
 * @file /src/index.js
 * @description Entry point for the LLM interface module, dynamically loading LLMInterface for different LLM providers.
 */

const {
  LLMInterface,
  LLMInterfaceSendMessage,
  LLMInterfaceStreamMessage,
  LLMInterfaceSendMessageWithConfig,
  LLMInterfaceStreamMessageWithConfig,
} = require('./utils/message.js');

const {
  getAllModelNames,
  setApiKey,
  getModelConfigValue,
  setModelAlias,
} = require('./utils/config.js');

// LLMInterface get functions
LLMInterface.getAllModelNames = getAllModelNames;
LLMInterface.getModelConfigValue = getModelConfigValue;

// LLMInterface set functions
LLMInterface.setApiKey = setApiKey;
LLMInterface.setModelAlias = setModelAlias;

// LLMInterface chat functions
LLMInterface.streamMessage = LLMInterfaceStreamMessageWithConfig;
LLMInterface.sendMessage = LLMInterfaceSendMessageWithConfig;

module.exports = {
  LLMInterface,
  LLMInterfaceSendMessage,
  LLMInterfaceStreamMessage,
};
