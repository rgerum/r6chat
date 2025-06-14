import {
  SiAnthropic,
  SiGooglegemini,
  SiOpenai,
} from "@icons-pack/react-simple-icons";
import * as React from "react";
import { SiDeepSeek } from "./icons";

export const models_definitions = [
  {
    // https://platform.openai.com/docs/models
    label: "OpenAI",
    provider: "openai",
    icon: SiOpenai,
    options: [
      { value: "gpt-4", label: "gpt-4" },
      { value: "gpt-4o", label: "gpt-4o" },
      { value: "gpt-4o-mini", label: "gpt-4o-mini" },
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
