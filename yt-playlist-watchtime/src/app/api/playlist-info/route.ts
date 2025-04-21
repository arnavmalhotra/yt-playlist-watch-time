import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { parse, Duration } from 'duration-fns';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Helper function to extract Playlist ID from URL
function extractPlaylistId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const playlistId = parsedUrl.searchParams.get('list');
    // Basic validation for playlist ID format (optional but recommended)
    if (playlistId && /^[a-zA-Z0-9_-]+$/.test(playlistId)) {
      return playlistId;
    }
  } catch (error) {
    console.error("Error parsing URL:", error);
  }
  return null;
}

// Helper function to format total seconds into H:MM:SS
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const hoursStr = hours > 0 ? `${hours}:` : '';
  const minutesStr = String(minutes).padStart(hours > 0 ? 2 : 1, '0'); // Pad minutes if hours exist
  const secondsStr = String(seconds).padStart(2, '0');

  return `${hoursStr}${minutesStr}:${secondsStr}`;
}


// Helper function to parse ISO 8601 duration string to seconds
function parseISO8601Duration(durationString: string): number {
    if (!durationString) return 0;
    try {
        // duration-fns parse function expects a specific format,
        // it might not directly parse YouTube's PT#H#M#S format reliably
        // Let's manually parse it for robustness
        const matches = durationString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 0;

        const hours = parseInt(matches[1] || '0', 10);
        const minutes = parseInt(matches[2] || '0', 10);
        const seconds = parseInt(matches[3] || '0', 10);

        return hours * 3600 + minutes * 60 + seconds;
    } catch (error) {
        console.error(`Error parsing duration string "${durationString}":`, error);
        // Fallback using duration-fns if manual parse fails unexpectedly
        try {
            const parsed: Duration = parse(durationString);
            return (parsed.hours ?? 0) * 3600 + (parsed.minutes ?? 0) * 60 + (parsed.seconds ?? 0);
        } catch (innerError) {
             console.error(`Inner error parsing duration string "${durationString}" with duration-fns:`, innerError);
             return 0; // Return 0 if parsing fails
        }
    }
}

export async function POST(req: NextRequest) {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YouTube API key is not set.');
    return NextResponse.json({ error: 'Server configuration error: API key missing.' }, { status: 500 });
  }

  try {
    const { playlistUrl } = await req.json();

    if (!playlistUrl || typeof playlistUrl !== 'string') {
      return NextResponse.json({ error: 'Playlist URL is required.' }, { status: 400 });
    }

    const playlistId = extractPlaylistId(playlistUrl);

    if (!playlistId) {
      return NextResponse.json({ error: 'Invalid YouTube Playlist URL format.' }, { status: 400 });
    }

    let videoIds: string[] = [];
    let nextPageToken: string | undefined | null = undefined;

    // 1. Fetch all video IDs from the playlist (handling pagination)
    do {
      const playlistResponse = await youtube.playlistItems.list({
        part: ['contentDetails'],
        playlistId: playlistId,
        maxResults: 50, // Max allowed by API
        pageToken: nextPageToken ?? undefined,
      });

      const currentVideoIds = playlistResponse.data.items
        ?.map(item => item.contentDetails?.videoId)
        .filter((id): id is string => !!id) ?? []; // Filter out undefined/null IDs

      videoIds = videoIds.concat(currentVideoIds);
      nextPageToken = playlistResponse.data.nextPageToken;

    } while (nextPageToken);

    if (videoIds.length === 0) {
        return NextResponse.json({ videoCount: 0, totalWatchTime: "0:00", formattedDuration: "0 seconds" });
    }

    // 2. Fetch video details (durations) for all video IDs (in batches of 50)
    let totalSeconds = 0;
    const videoDetailsPromises = [];
    for (let i = 0; i < videoIds.length; i += 50) {
        const videoIdBatch = videoIds.slice(i, i + 50);
        videoDetailsPromises.push(
            youtube.videos.list({
                part: ['contentDetails'], // We only need contentDetails for duration
                id: videoIdBatch,
            })
        );
    }

    const videoDetailsResponses = await Promise.all(videoDetailsPromises);

    videoDetailsResponses.forEach(response => {
        response.data.items?.forEach(item => {
            const durationString = item.contentDetails?.duration;
            if(durationString) {
                 totalSeconds += parseISO8601Duration(durationString);
            }
        });
    });


    // 3. Format the total duration
    const formattedDuration = formatDuration(totalSeconds);

    return NextResponse.json({
      videoCount: videoIds.length,
      totalWatchTime: formattedDuration,
      totalSeconds: totalSeconds // Optionally return total seconds
    });

  } catch (error: any) {
    console.error('Error fetching playlist info:', error);

    // Check for specific Google API errors
    if (error.response?.data?.error) {
        const ytError = error.response.data.error;
        console.error('YouTube API Error:', ytError);
        // Provide a more specific error message if possible
        let message = `YouTube API Error: ${ytError.message || 'Unknown error'}`;
        if (ytError.errors?.length > 0) {
            message = `YouTube API Error (${ytError.errors[0].reason}): ${ytError.errors[0].message}`;
             // Handle specific common errors
             if (ytError.errors[0].reason === 'playlistNotFound') {
                return NextResponse.json({ error: 'Playlist not found. Check the URL or playlist privacy settings.' }, { status: 404 });
            }
             if (ytError.errors[0].reason === 'forbidden') {
                 return NextResponse.json({ error: 'Access forbidden. The playlist might be private or deleted.' }, { status: 403 });
             }
             // You might want to check for quotaExceeded errors too
        }
        return NextResponse.json({ error: message }, { status: error.response.status || 500 });
    }

    return NextResponse.json({ error: 'Failed to fetch playlist information.' }, { status: 500 });
  }
} 