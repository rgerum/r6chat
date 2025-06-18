import {
  IconType,
  SiAnthropic,
  SiGooglegemini,
  SiOpenai,
} from "@icons-pack/react-simple-icons";
import * as React from "react";
import { SiDeepSeek } from "./icons";

export type ModelDefinition = {
  label: string;
  provider: string;
  icon: IconType;
  options: {
    value: string;
    label: string;
    websearch?: boolean;
    attachments?: boolean;
    image_generation?: boolean;
  }[];
};

export const models_definitions = [
  {
    // https://platform.openai.com/docs/models
    label: "OpenAI",
    provider: "openai",
    icon: SiOpenai,
    options: [
      { value: "gpt-4", label: "gpt-4", websearch: true },
      { value: "gpt-4o", label: "gpt-4o" },
      {
        value: "gpt-4o-mini",
        label: "gpt-4o-mini",
        websearch: true,
        attachments: true,
      },
      { value: "gpt-image-1", label: "gpt-image-1", image_generation: true },
    ],
  },
  {
    // https://ai.google.dev/gemini-api/docs/models
    label: "Gemini",
    provider: "google",
    icon: SiGooglegemini,
    options: [
      { value: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-pro-preview-06-05", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      {
        value: "gemini-2.0-flash-lite",
        label: "Gemini 2.0 Flash-Lite",
      },
      {
        value: "gemini-2.0-flash-exp",
        label: "Gemini 2.0 Flash-Exp",
        image_generation: true,
      },
    ],
  },
  {
    // https://docs.anthropic.com/en/docs/about-claude/models/overview
    label: "Anthropic",
    provider: "anthropic",
    icon: SiAnthropic,
    options: [
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      {
        value: "claude-opus-4-20250514",
        label: "Claude Opus 4",
      },
    ],
  },
  {
    label: "DeepSeek",
    provider: "deepseek",
    icon: SiDeepSeek,
    options: [{ value: "deepseek-chat", label: "DeepSeek Chat" }],
  },
];

export function getModelProperties(model_name: string) {
  for (const definition of models_definitions)
    for (const model of definition.options)
      if (model.value === model_name)
        return {
          provider: definition.provider,
          websearch: !!model.websearch,
          attachments: !!model.attachments,
          image_generation: !!model.image_generation,
        };
  throw new Error(`Unknown model: ${model_name}`);
}
