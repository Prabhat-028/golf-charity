const sizeStyles = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
};

export default function Avatar({
    src,
    alt = "",
    fallback,
    size = "md",
    className = "",
    ...props
}) {
    const initials =
        fallback ||
        alt
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    return (
        <div
            className={`relative inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium overflow-hidden ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
            ) : (
                <span>{initials || "?"}</span>
            )}
        </div>
    );
}
