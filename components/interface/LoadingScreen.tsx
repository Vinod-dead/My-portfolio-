"use client";

/**
 * Shown only while the 3D scene is being created. There is no fake percentage:
 * the scene has no downloadable assets to measure, so this is an honest
 * indeterminate indicator, and a classic-view escape hatch is always offered.
 */
export function LoadingScreen({ onClassic }: { onClassic: () => void }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading-bot" aria-hidden="true">
        <i />
        <i />
      </div>
      <p className="display">Preparing the scene…</p>
      <button type="button" className="btn" onClick={onClassic}>
        Skip to the classic view
      </button>
    </div>
  );
}
