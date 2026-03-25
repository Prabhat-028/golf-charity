import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import Button from "./Button";

const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = "md",
}) {
    const dialogRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        function handleEscape(e) {
            if (e.key === "Escape") onClose();
        }
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const previousActive = document.activeElement;
        const dialog = dialogRef.current;

        if (dialog) {
            const focusable = dialog.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            if (focusable.length > 0) {
                focusable[0].focus();
            } else {
                dialog.focus();
            }
        }

        function handleFocusTrap(event) {
            if (event.key !== "Tab" || !dialogRef.current) return;

            const focusable = dialogRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );

            if (!focusable.length) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", handleFocusTrap);
        return () => {
            document.removeEventListener("keydown", handleFocusTrap);
            if (previousActive && previousActive.focus) {
                previousActive.focus();
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
                <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? titleId : undefined}
                    aria-describedby={descriptionId}
                    tabIndex={-1}
                    className={`relative w-full ${sizeStyles[size]} bg-white rounded-xl shadow-xl transform transition-all`}
                >
                    {title && (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2
                                id={titleId}
                                className="text-lg font-semibold text-gray-900"
                            >
                                {title}
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="p-1"
                                aria-label="Close dialog"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                    <div id={descriptionId} className="px-6 py-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
