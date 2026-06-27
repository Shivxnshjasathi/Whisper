import { forwardRef } from 'react';

const variants = {
  primary:
    'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 active:scale-[0.97]',
  secondary:
    'bg-white/10 text-white border border-white/10 hover:bg-white/15 active:scale-[0.97]',
  ghost:
    'text-white/70 hover:text-white hover:bg-white/5 active:scale-[0.97]',
  danger:
    'bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 active:scale-[0.97]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  icon: 'p-2.5',
};

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    loading = false,
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

export default Button;
