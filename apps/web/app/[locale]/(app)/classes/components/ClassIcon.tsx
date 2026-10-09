import NavigationIcon from "@/components/layout/NavigationIcon";

export default function ClassIcon({
  full = false,
  large = false,
}: {
  full?: boolean;
  large?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border ${large ? "h-14 w-14" : "h-10 w-10"} ${full ? "border-red-500/25 bg-red-500/5 text-red-400" : "border-accent/25 bg-accent/10 text-accent"}`}
    >
      <NavigationIcon
        name="workouts"
        className={large ? "h-7 w-7" : "h-5 w-5"}
      />
    </span>
  );
}
