"use client";

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Film, BarChart2, Calendar, TrendingUp, Coffee } from 'lucide-react';

// Define a type for the results including new fields
interface PlaylistInfo {
  title?: string | null;
  description?: string | null;
  channelTitle?: string | null;
  publishedAt?: string | null;
  videoCount: number;
  totalWatchTime: string; // Formatted as H:MM:SS or MM:SS
  averageDuration: string; // Formatted average duration
  totalSeconds?: number; // Optional: raw seconds
}

// Simple SVG Spinner Component
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
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
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Helper to format date string
function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

// Helper to format duration at different playback speeds
function calculateAdjustedTime(seconds: number | undefined, speed: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return 'N/A';
  
  const adjustedSeconds = Math.round(seconds / speed);
  
  if (isNaN(adjustedSeconds)) return 'N/A';
  
  const hours = Math.floor(adjustedSeconds / 3600);
  const minutes = Math.floor((adjustedSeconds % 3600) / 60);
  const remainingSeconds = adjustedSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Helper to get a human-readable estimate
function getTimeEstimate(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  
  if (hours < 1) {
    return "Less than an hour";
  } else if (hours < 5) {
    return "A few hours";
  } else if (hours < 24) {
    return "Less than a day";
  } else if (hours < 48) {
    return "About a day";
  } else if (hours < 168) { // 7 days
    return `About ${days} day${days > 1 ? 's' : ''}`;
  } else if (hours < 720) { // 30 days
    const weeks = Math.round(days / 7);
    return `About ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.round(days / 30);
    return `About ${months} month${months > 1 ? 's' : ''}`;
  }
}

export default function Home() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaylistInfo | null>(null);
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
      const response = await fetch('/api/playlist-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the specific error from the API if available
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      setResults(data as PlaylistInfo);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Define playback speeds
  const playbackSpeeds = [1.25, 1.5, 1.75, 2.0];

  return (
    <>
      <Head>
        <title>YouTube Playlist Analyzer - Calculate Total Watch Time</title>
        <meta name="description" content="Calculate the total watch time, average video length, and more stats for any YouTube playlist. Free online tool, no installation required." />
        <meta name="keywords" content="YouTube playlist analyzer, playlist duration calculator, total watch time, video length calculator" />
        <meta property="og:title" content="YouTube Playlist Analyzer" />
        <meta property="og:description" content="Calculate the total watch time for any YouTube playlist" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YouTube Playlist Analyzer" />
        <meta name="twitter:description" content="Calculate the total watch time for any YouTube playlist" />
      </Head>

      <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 sm:p-6 pt-8 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl space-y-10 sm:space-y-14"
        >
          <section className="text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-teal-700 mb-4"
            >
              YouTube Playlist Analyzer
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto"
            >
              Instantly calculate total watch time, average duration, and more for any YouTube playlist.
            </motion.p>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
          >
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              <div>
                <label htmlFor="playlistUrl" className="block text-sm font-medium text-gray-800 mb-1.5">
                  Enter YouTube Playlist URL
                </label>
                <input
                  id="playlistUrl"
                  name="playlistUrl"
                  type="url"
                  required
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 placeholder-gray-500 transition duration-150 ease-in-out"
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  aria-label="YouTube playlist URL"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors duration-200 ${loading ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'} disabled:opacity-60`}
                aria-label="Analyze playlist"
              >
                {loading ? <><Spinner /> <span className="ml-2">Calculating...</span></> : "Analyze Playlist"}
              </motion.button>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-t border-gray-200 p-4 sm:p-6 text-sm text-red-700 bg-red-50"
                role="alert"
              >
                <span className="font-semibold">Error:</span> {error}
              </motion.div>
            )}
          </motion.div>

          {results ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 sm:space-y-8"
            >
              {/* Playlist Info Header */}
              <div className="bg-white rounded-lg shadow-md p-5 sm:p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-200 pb-4 mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 truncate" title={results.title || undefined}>
                    {results.title || "Playlist Analysis"}
                  </h2>
                  {results.channelTitle && (
                    <div className="text-sm bg-teal-100 text-teal-800 px-3 py-1 rounded-full font-medium self-start sm:self-center">
                      {results.channelTitle}
                    </div>
                  )}
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={<Film size={20} className="text-teal-500"/>} label="Total Videos" value={results.videoCount.toString()} />
                  <StatCard icon={<Clock size={20} className="text-teal-500"/>} label="Total Time" value={results.totalWatchTime} />
                  <StatCard icon={<BarChart2 size={20} className="text-teal-500"/>} label="Avg. Length" value={results.averageDuration} />
                  {results.publishedAt && (
                    <StatCard icon={<Calendar size={20} className="text-teal-500"/>} label="Published" value={formatDate(results.publishedAt)} smallValue={true} />
                  )}
                </div>
              </div>

              {/* Time Estimates & Speeds */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-5 sm:p-6 border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-teal-600"/> Watch Time Insights
                </h3>
                <p className="text-gray-700 mb-5 text-sm sm:text-base">
                  It would take approximately <span className="font-semibold text-teal-700">{getTimeEstimate(results.totalSeconds)}</span> to watch this playlist back-to-back.
                </p>

                <h4 className="text-sm font-medium text-gray-600 mb-3">Watch faster:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {playbackSpeeds.map(speed => (
                    <motion.div
                      key={speed}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="bg-teal-50 p-3 rounded-lg text-center border border-teal-100"
                    >
                      <p className="text-xs text-teal-800 font-semibold mb-1">{speed}x Speed</p>
                      <p className="text-sm font-bold text-teal-700">
                        {calculateAdjustedTime(results.totalSeconds, speed)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Description if available */}
              {results.description && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-lg shadow-md p-5 sm:p-6 border border-gray-200"
                >
                  <h3 className="text-base font-medium text-gray-700 mb-2">Description:</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap overflow-y-auto max-h-32 pr-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 rounded">
                    {results.description}
                  </p>
                </motion.div>
              )}

              {/* Binge-Watching Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-md p-5 sm:p-6 border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Coffee size={20} className="text-teal-600"/> Binge-Watch Calculator
                </h3>
                <div className="space-y-3 text-sm sm:text-base text-gray-700">
                  <BingeStat label="Watching 1 hour/day:" value={`${Math.ceil((results.totalSeconds || 0) / 3600)} days`} valueColor="text-teal-700" />
                  <BingeStat label="Watching 3 hours/day:" value={`${Math.ceil((results.totalSeconds || 0) / (3600 * 3))} days`} valueColor="text-teal-700" />
                  <BingeStat label="Avg. videos per hour:" value={results.totalSeconds && results.videoCount ? (3600 / (results.totalSeconds / results.videoCount)).toFixed(1) : 'N/A'} valueColor="text-teal-700" />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">
                  How It Works
                </h2>

                <div className="space-y-6">
                  <HowItWorksStep num={1} title="Copy Playlist URL" description="Find any public YouTube playlist and copy its URL from your browser." />
                  <HowItWorksStep num={2} title="Paste & Analyze" description="Paste the URL into the field above and click 'Analyze Playlist'." />
                  <HowItWorksStep num={3} title="Get Detailed Stats" description="View total time, video count, average length, and playback speed options." />
                </div>
              </div>

              <div
                className="mt-6 px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-200"
              >
                <h3 className="text-sm font-medium text-gray-700 mb-2">Example URL Format:</h3>
                <code className="block p-3 bg-gray-200 rounded text-xs sm:text-sm text-gray-800 break-all">https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxx</code>
              </div>
            </motion.div>
          )}

          <footer className="text-center pt-8 text-gray-500 text-sm">
            © {new Date().getFullYear()} YouTube Playlist Analyzer. Developed by <a href="https://arnavmalhotra.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">Arnav Malhotra</a>. All rights reserved.
          </footer>
        </motion.div>
      </main>
    </>
  );
}

// Helper component for Stats Cards
const StatCard = ({ icon, label, value, smallValue = false }: { icon: React.ReactNode, label: string, value: string, smallValue?: boolean }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 flex flex-col items-start space-y-1 transition-shadow hover:shadow-md"
  >
    <div className="flex items-center gap-2 text-gray-500">
      {icon}
      <p className="font-medium text-xs sm:text-sm">{label}</p>
    </div>
    <p className={`font-bold text-teal-600 ${smallValue ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}>{value}</p>
  </motion.div>
);

// Helper component for Binge Stats
const BingeStat = ({ label, value, valueColor = "text-gray-800" }: { label: string, value: string, valueColor?: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-2 last:border-b-0">
    <p className="text-gray-600">{label}</p>
    <p className={`font-semibold ${valueColor} text-right`}>{value}</p>
  </div>
);

// Helper component for How It Works steps
const HowItWorksStep = ({ num, title, description }: { num: number, title: string, description: string }) => (
   <motion.div
      whileHover={{ x: 4 }}
      className="flex items-start space-x-4 group"
    >
      <div className="flex-shrink-0 mt-0.5">
        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-teal-600 text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform duration-150 ease-in-out">
          {num}
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
        <p className="text-gray-600 mt-1 text-sm">{description}</p>
      </div>
    </motion.div>
);
