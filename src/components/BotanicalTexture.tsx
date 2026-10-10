/** Subtle inline ornament used only for decoration behind planner content. */
export function BotanicalTexture({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.15"
      >
        <path d="M-12 205C35 176 58 138 83 93s43-69 82-82M14 188c-2-20-13-32-31-38m52 12c-1-21-12-34-30-41m53 9c-1-20-10-32-27-40m51 4c0-18-7-29-22-38m-62 97c20-1 33-10 41-27m-18 51c21-1 34-10 42-27m-15-41c-1-20 7-34 23-42m-4 65c20-1 34-9 43-25m-17-39c0-20 8-33 25-40m-7 64c20-2 34-10 44-26" />
        <path d="M84 93c-18-9-27-23-26-42 19 4 30 17 26 42Zm-31 38c-20-5-31-17-34-36 20 1 33 12 34 36Zm43-15c18-10 27-25 24-44-19 5-29 19-24 44Zm-64 10c-4-19-16-31-35-34-1 20 10 33 35 34Zm67 28c20-3 33-14 39-33-20 0-34 11-39 33Zm-53 13c-20 2-34-7-43-25 19-6 35 2 43 25Zm94-93c-18-11-26-26-22-45 19 6 28 21 22 45Z" />
        <circle cx="189" cy="190" r="2" />
        <path d="m189 183 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Zm-28-39 1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5 1.5-3.5Z" />
      </g>
    </svg>
  );
}
