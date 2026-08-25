function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function IconReported() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2 2 4-4" />
    </IconBase>
  );
}

export function IconNotIssue() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 8l8 8" />
    </IconBase>
  );
}

export function IconDelivered() {
  return (
    <IconBase>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9L2.7 17a1.8 1.8 0 0 0 1.6 2.7h15.4a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0z" />
    </IconBase>
  );
}

export function IconFixed() {
  return (
    <IconBase>
      <path d="M20 6L9 17l-5-5" />
    </IconBase>
  );
}

export function IconUnfixable() {
  return (
    <IconBase>
      <path d="M18 6L6 18M6 6l12 12" />
    </IconBase>
  );
}

export function IconTrendingUp() {
  return (
    <IconBase>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </IconBase>
  );
}
