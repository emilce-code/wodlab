import { BRAND } from '@/lib/brand';

type Props = {
  className?: string;
};

export default function Wordmark({
  className = '',
}: Props) {
  return (
    <span
      className={[
        'inline-flex items-center text-xl font-black tracking-tight',
        className,
      ].join(' ')}
    >
      {BRAND.name}
    </span>
  );
}