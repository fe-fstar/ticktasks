"use client";

// A CSS animation, not a Motion one: this bar plays exactly while the page is
// busy navigating or submitting, and CSS animations run off the main thread,
// so the bar stays smooth while JavaScript is working.
export default function MotionLoader({ pending }: { pending?: boolean }) {
    if (!pending) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 h-2 z-9999 overflow-hidden pointer-events-none"
            role="progressbar"
            aria-label="Loading"
        >
            <div
                className="h-full w-[200vw] animate-loader-slide motion-reduce:animate-none"
                style={{
                    background: "linear-gradient(to right, var(--primary), var(--primary-foreground), var(--primary), var(--primary-foreground), var(--primary))",
                }}
            />
        </div>
    );
}
