"use client";

export default function OfflineReloadButton() {
    return (
        <button
            onClick={() => window.location.reload()}
            className="app-button app-button-primary w-full max-w-xs justify-center"
        >
            Try Again
        </button>
    );
}
