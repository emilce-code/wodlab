type Props = {
  className?: string;
};

export default function LogoMark({
  className = '',
}: Props) {
  return (
    <div
      aria-label="WODLY"
      className={[
        'relative flex h-9 w-9 items-center justify-center',
        className,
      ].join(' ')}
    >
      <div className="absolute left-1 top-2 h-5 w-2 -skew-x-12 bg-foreground" />
      <div className="absolute left-3.5 top-2 h-5 w-2 skew-x-12 bg-foreground" />
      <div className="absolute right-1.5 top-2 h-5 w-2 -skew-x-12 bg-foreground" />

      <div className="absolute bottom-1 right-0 h-2 w-2 rounded-sm bg-accent" />
    </div>
  );
}