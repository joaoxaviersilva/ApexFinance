type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className = '' }: LogoMarkProps) {
  return (
    <span className={`logo-mark ${className}`.trim()} aria-hidden="true">
      <span className="logo-mark__left" />
      <span className="logo-mark__right" />
    </span>
  );
}
