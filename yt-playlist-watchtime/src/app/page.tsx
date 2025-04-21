"use client";

import { useState } from "react";

// Define a type for the results
interface PlaylistInfo {
  videoCount: number;
  totalWatchTime: string; // Formatted as H:MM:SS or MM:SS
  totalSeconds?: number; // Optional: raw seconds
}

export default function Home() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaylistInfo | null>(null); // Use the interface type
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    // Basic URL validation (can be improved)
    if (!playlistUrl.includes("youtube.com/playlist?list=")) {
      setError("Invalid YouTube Playlist URL format. Please include 'youtube.com/playlist?list='.");
      setLoading(false);
      return;
    }

    try {
      // console.log("Submitting URL:", playlistUrl);
      // Make the API call to our backend route
      const response = await fetch('/api/playlist-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch playlist info');
      }

      setResults(data as PlaylistInfo); // Set results from the API response

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          YouTube Playlist Watch Time
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playlistUrl" className="block text-sm font-medium text-gray-700">
              Playlist URL
            </label>
            <input
              id="playlistUrl"
              name="playlistUrl"
              type="url"
              required
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              placeholder="https://www.youtube.com/playlist?list=PL..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
          >
            {loading ? "Calculating..." : "Calculate Watch Time"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-300">
            Error: {error}
          </div>
        )}

        {results && (
          <div className="mt-6 p-4 space-y-3 bg-green-50 rounded-md border border-green-200">
            <h2 className="text-lg font-semibold text-gray-800">Results:</h2>
            <p className="text-gray-700">
              <span className="font-medium">Total Videos:</span> {results.videoCount}
            </p>
            <p className="text-gray-700">
               <span className="font-medium">Total Watch Time:</span> {results.totalWatchTime}
             </p>
            {/* You could add more detailed results here, like total seconds */}
            {/* {results.totalSeconds && (
            <p className="text-gray-700">
              <span className="font-medium">Total Seconds:</span> {results.totalSeconds}
            </p>
            )} */}
          </div>
        )}
      </div>
    </main>
  );
}
