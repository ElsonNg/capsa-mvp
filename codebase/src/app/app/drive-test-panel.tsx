"use client";

import { useState } from "react";

type DriveTestResult = {
  status?: unknown;
  files?: unknown;
  error?: string;
};

export function DriveTestPanel() {
  const [result, setResult] = useState<DriveTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function testDriveConnector() {
    setLoading(true);
    setResult(null);

    try {
      const [statusResponse, filesResponse] = await Promise.all([
        fetch("/api/sources/google-drive/status"),
        fetch("/api/sources/google-drive/files?pageSize=10"),
      ]);

      const [status, files] = await Promise.all([
        statusResponse.json(),
        filesResponse.json(),
      ]);

      setResult({ status, files });
    } catch (error) {
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "Google Drive connector test failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#e6e8ea] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#191c1e]">
            Google Drive connector
          </h3>
          <p className="mt-1 text-sm font-medium text-[#5f666d]">
            Checks Drive connection status and lists up to 10 Docs/PDFs.
          </p>
        </div>
        <button
          onClick={testDriveConnector}
          disabled={loading}
          className="rounded-md bg-[#ff6a00] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d95800] disabled:cursor-not-allowed disabled:bg-[#d4d8dc]"
        >
          {loading ? "Testing..." : "Test Google Drive"}
        </button>
      </div>

      <pre className="mt-5 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border border-[#e6e8ea] bg-[#f7f9fb] p-4 text-sm leading-6 text-[#191c1e]">
        {result
          ? JSON.stringify(result, null, 2)
          : "Click the button to test the Drive backend."}
      </pre>
    </section>
  );
}
