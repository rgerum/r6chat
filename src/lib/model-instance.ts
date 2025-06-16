import { models_definitions } from "@/lib/model-definitions";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";

export function getModelProvider(model_name: string) {
  for (const definition of models_definitions)
    for (const model of definition.options)
      if (model.value === model_name) return definition.provider;
}

export function getModelInstance(
  model_name: string,
  args: { apiKey?: string },
) {
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
