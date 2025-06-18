import {
  getModelProperties,
  models_definitions,
} from "@/lib/model-definitions";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function getModelProvider(model_name: string) {
  for (const definition of models_definitions)
    for (const model of definition.options)
      if (model.value === model_name) return definition.provider;
}

export function getModelInstance(
  model_name: string,
  args: { apiKey?: string } | undefined,
  argsOpenRouter: { apiKey?: string } | undefined,
) {
  if (!args && !argsOpenRouter) {
    throw new Error("No API key provided");
  }
  const properties = getModelProperties(model_name);
  if (!args) {
    if (properties.image_generation)
      throw new Error("No image generation with open router");
    const provider = getModelProvider(model_name);
    const openrouter = createOpenRouter(argsOpenRouter);
    return openrouter.chat(provider + "/" + model_name);
  }

  switch (getModelProvider(model_name)) {
    case "openai":
      return createOpenAI(args)(model_name);
    case "google":
      return createGoogleGenerativeAI(args)(model_name);
    case "anthropic":
      return createAnthropic(args)(model_name);
    case "deepseek":
      return createDeepSeek(args)(model_name);
  }
}
