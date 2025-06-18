// Suggestion item component
import React, { useState } from "react";
import {
  Code,
  GraduationCap,
  Newspaper,
  Sparkles,
  MessageSquareText,
} from "lucide-react";

const SuggestionItem = ({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) => (
  <div className="flex items-start gap-2 border-t border-secondary/40 py-1 first:border-none">
    <button
      onClick={onClick}
      className="w-full rounded-md py-2 text-left text-secondary-foreground hover:bg-secondary/50 sm:px-3 transition-colors duration-200"
    >
      <span>{text}</span>
    </button>
  </div>
);

// Action button component
const ActionButton = ({
  icon: Icon,
  label,
  isSelected = false,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isSelected?: boolean;
  onClick: () => void;
}) => {
  const baseClasses =
    "justify-center whitespace-nowrap text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 flex items-center gap-1 rounded-xl px-5 py-2 font-semibold outline-1 outline-secondary/70 backdrop-blur-xl max-sm:size-16 max-sm:flex-col sm:gap-2 sm:rounded-full";
  const selectedClasses = isSelected
    ? "border-reflect button-reflect bg-pink-300 text-primary-foreground shadow hover:bg-pink-400 active:bg-pink-300"
    : "bg-primary text-primary-foreground shadow hover:bg-pink-600/90 data-[selected=false]:bg-secondary/30 data-[selected=false]:text-secondary-foreground/90 data-[selected=false]:outline data-[selected=false]:hover:bg-secondary";

  return (
    <button
      className={`${baseClasses} ${selectedClasses}`}
      data-selected={isSelected}
      onClick={onClick}
    >
      <Icon className="max-sm:block" />
      <div>{label}</div>
    </button>
  );
};

// Default suggestions shown when no action is selected
const DEFAULT_SUGGESTIONS = [
  "Why is Theo's favorite color pink?",
  "Does looking at pink make me use TypeScript?",
  "Will mentioning Theo help me win the Cloneathon?",
  "Why is everyone subscribed to Theo's YouTube channel?",
];

// Suggestion sets for different actions
const SUGGESTION_SETS = {
  create: [
    "Create a clone of T3 chat",
    "Design a language like JS but with types",
    "Develop the T4 stack",
    "Create the best AI chat app ever",
  ],
  explore: [
    "What's the next version of React?",
    "Explore the benefits of keeping my data private",
    "Reasons to use an AI editor",
    "What are the coolest types in TypeScript?",
  ],
  code: [
    "Show me how to properly type a Next.js API route with TypeScript",
    "Help me debug this React hook dependency array",
    "Explain the T3 stack architecture like I'm five",
    "Convert this JavaScript snippet to TypeScript",
  ],
  learn: [
    "How to I learn to think without AI?",
    "Getting a job as a software developer",
    "Why we need servers if clients are easier",
    "How can I migrate by database, again?",
  ],
};

// Action button configurations
const ACTIONS = [
  { id: "create", label: "Create", icon: Sparkles },
  { id: "explore", label: "Explore", icon: Newspaper },
  { id: "code", label: "Code", icon: Code },
  { id: "learn", label: "Learn", icon: GraduationCap },
];

// Empty state component
export const EmptyState = ({
  hasInput,
  onSuggestionClick,
}: {
  hasInput: boolean;
  onSuggestionClick: (suggestion: string) => void;
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleActionClick = (actionId: string) => {
    setSelectedAction(selectedAction === actionId ? null : actionId);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (selectedAction) {
      onSuggestionClick(suggestion);
    }
  };

  return (
    <div
      className={
        !hasInput
          ? "w-full space-y-6 px-0 pt-[calc(max(15vh,2.5rem))] duration-300 animate-in fade-in-50 zoom-in-95 sm:px-0"
          : "w-full space-y-6 px-0 pt-[calc(max(15vh,2.5rem))] duration-300 animate-in fade-in-50 zoom-in-95 sm:px-0 pointer-events-none opacity-0 animate-out fade-out-0 zoom-out-105"
      }
    >
      <h2 className="text-3xl font-semibold">
        {selectedAction
          ? `Here are some ${selectedAction} suggestions`
          : "How can I help you, today?"}
      </h2>

      <div className="flex flex-row flex-wrap gap-2.5 text-sm max-sm:justify-evenly">
        {ACTIONS.map((action) => (
          <ActionButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            isSelected={selectedAction === action.id}
            onClick={() => handleActionClick(action.id)}
          />
        ))}
      </div>

      <div className="flex flex-col text-foreground transition-all duration-300 min-h-[200px]">
        <div className="space-y-2">
          {!selectedAction
            ? DEFAULT_SUGGESTIONS.map((suggestion, index) => (
                <SuggestionItem
                  key={`default-${index}`}
                  text={suggestion}
                  onClick={() => onSuggestionClick(suggestion)}
                />
              ))
            : SUGGESTION_SETS[
                selectedAction as keyof typeof SUGGESTION_SETS
              ].map((suggestion, index) => (
                <SuggestionItem
                  key={`${selectedAction}-${index}`}
                  text={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                />
              ))}
        </div>
      </div>
    </div>
  );
};
