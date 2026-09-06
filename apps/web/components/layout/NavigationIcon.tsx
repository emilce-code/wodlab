export type NavigationIconName =
  | "today"
  | "workouts"
  | "training"
  | "history"
  | "progress"
  | "more"
  | "movements"
  | "account"
  | "coach"
  | "close";

type Props = {
  name: NavigationIconName;
  className?: string;
};

const paths: Record<NavigationIconName, React.ReactNode> = {
  today: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  workouts: (
    <>
      <path d="M6 7v10M3 9v6M18 7v10M21 9v6" />
      <path d="M6 12h12" />
    </>
  ),
  training: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  progress: (
    <>
      <path d="M4 19V5" />
      <path d="m6 16 4-5 3 3 5-7" />
      <path d="M15 7h3v3" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  movements: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <path d="M8 4v6M16 9v6M10 14v6" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  coach: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 7h5M18.5 4.5v5" />
      <path d="m16 15 2 2 4-5" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
};

export default function NavigationIcon({ name, className = "" }: Props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
