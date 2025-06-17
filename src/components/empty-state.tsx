// Suggestion item component
import React from "react";
import { Code, GraduationCap, Newspaper, Sparkles } from "lucide-react";

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
      className="w-full rounded-md py-2 text-left text-secondary-foreground hover:bg-secondary/50 sm:px-3"
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
    "justify-center whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 flex items-center gap-1 rounded-xl px-5 py-2 font-semibold outline-1 outline-secondary/70 backdrop-blur-xl max-sm:size-16 max-sm:flex-col sm:gap-2 sm:rounded-full";
  const selectedClasses = isSelected
    ? "border-reflect button-reflect bg-[rgb(162,59,103)] text-primary-foreground shadow hover:bg-[#d56698] active:bg-[rgb(162,59,103)] disabled:hover:bg-[rgb(162,59,103)] disabled:active:bg-[rgb(162,59,103)] dark:bg-primary/20 dark:hover:bg-pink-800/70 dark:active:bg-pink-800/40 disabled:dark:hover:bg-primary/20 disabled:dark:active:bg-primary/20"
    : "bg-primary text-primary-foreground shadow hover:bg-pink-600/90 disabled:hover:bg-primary data-[selected=false]:bg-secondary/30 data-[selected=false]:text-secondary-foreground/90 data-[selected=false]:outline data-[selected=false]:hover:bg-secondary";

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
// Empty state component
export const EmptyState = ({
  hasInput,
  onSuggestionClick,
}: {
  hasInput: boolean;
  onSuggestionClick: (suggestion: string) => void;
}) => {
  const actions = [
    { icon: Sparkles, label: "Create", id: "create" },
    { icon: Newspaper, label: "Explore", id: "explore" },
    { icon: Code, label: "Code", id: "code" },
    { icon: GraduationCap, label: "Learn", id: "learn" },
  ];

  const suggestions = [
    "Beginner's guide to TypeScript",
    "Explain the CAP theorem in distributed systems",
    "Why is AI so expensive?",
    "Are black holes real?",
  ];

  return (
    <div
      className={
        !hasInput
          ? "w-full space-y-6 px-2 pt-[calc(max(15vh,2.5rem))] duration-300 animate-in fade-in-50 zoom-in-95 sm:px-8"
          : "w-full space-y-6 px-2 pt-[calc(max(15vh,2.5rem))] duration-300 animate-in fade-in-50 zoom-in-95 sm:px-8 pointer-events-none opacity-0 animate-out fade-out-0 zoom-out-105"
      }
    >
      <h2 className="text-3xl font-semibold">How can I help you, Richard?</h2>

      <div className="flex flex-row flex-wrap gap-2.5 text-sm max-sm:justify-evenly">
        {actions.map((action) => (
          <ActionButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            isSelected={action.id === "learn"}
            onClick={() => console.log(`Action: ${action.id}`)}
          />
        ))}
      </div>

      <div className="flex flex-col text-foreground">
        {suggestions.map((suggestion, index) => (
          <SuggestionItem
            key={index}
            text={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
          />
        ))}
      </div>
    </div>
  );
};
