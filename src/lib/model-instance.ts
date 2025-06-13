import { models_definitions } from "@/lib/model-definitions";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { deepseek } from "@ai-sdk/deepseek";

export function getModelInstance(model_name: string) {
  for (const definition of models_definitions)
    for (const model of definition.options)
      if (model.value === model_name) {
        if (definition.provider === "openai") return openai(model.value);
        if (definition.provider === "google") return google(model.value);
        if (definition.provider === "anthropic") return anthropic(model.value);
        if (definition.provider === "deepseek") return deepseek(model.value);
      }
}
