const COLORS = {
  Shivansh: 'from-violet-500 to-purple-600',
  Kuhu: 'from-rose-400 to-pink-500',
  default: 'from-gray-400 to-gray-500',
};

export default function Avatar({ name = 'U', size = 'md', className = '' }) {
  const initial = name.charAt(0).toUpperCase();
  const gradient = COLORS[name] || COLORS.default;

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={`
        ${sizes[size]}
        bg-gradient-to-br ${gradient}
        rounded-full flex items-center justify-center
        font-semibold text-white shadow-lg
        ring-2 ring-white/10
        ${className}
      `}
      aria-label={name}
    >
      {initial}
    </div>
  );
}
