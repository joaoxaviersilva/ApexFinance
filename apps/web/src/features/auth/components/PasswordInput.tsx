import { type ChangeEventHandler, useState } from 'react';

import { EyeIcon, LockIcon } from './AuthIcons';

type PasswordInputProps = {
  id: string;
  name: string;
  autoComplete: string;
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  showLabel: string;
  hideLabel: string;
};

export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  disabled = false,
  invalid = false,
  describedBy,
  onChange,
  showLabel,
  hideLabel,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="field-control">
      <LockIcon />

      <input
        id={id}
        name={name}
        type={isVisible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        disabled={disabled}
        onChange={onChange}
      />

      <button
        type="button"
        className="password-toggle"
        aria-label={isVisible ? hideLabel : showLabel}
        aria-pressed={isVisible}
        disabled={disabled}
        onClick={() => {
          setIsVisible((currentValue) => !currentValue);
        }}
      >
        <EyeIcon />
      </button>
    </div>
  );
}
