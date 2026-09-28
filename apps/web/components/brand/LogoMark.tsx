import Image from 'next/image';

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
        'relative flex h-9 w-9 items-center justify-center overflow-hidden',
        className,
      ].join(' ')}
    >
      <Image
        src="/brand-mark-primary.png"
        alt=""
        aria-hidden="true"
        width={1024}
        height={1024}
        className="h-full w-full object-contain dark:hidden"
        priority
      />
      <Image
        src="/brand-mark-inverted.png"
        alt=""
        aria-hidden="true"
        width={1024}
        height={1024}
        className="hidden h-full w-full object-contain dark:block"
        priority
      />
    </div>
  );
}
