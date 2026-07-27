import type { ReactNode } from "react";

const URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/g;
const URL_TEST_PATTERN = /^https?:\/\/[^\s]+$/;

export function linkifyText(text: string): ReactNode {
  return text.split(URL_SPLIT_PATTERN).map((part, index) =>
    URL_TEST_PATTERN.test(part) ? (
      <a href={part} key={`${index}-${part}`} rel="noreferrer" target="_blank">
        {part}
      </a>
    ) : (
      part
    ),
  );
}
