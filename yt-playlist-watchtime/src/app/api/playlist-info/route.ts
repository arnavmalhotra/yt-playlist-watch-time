import { NextRequest, NextResponse } from 'next/server';
import { google, youtube_v3 } from 'googleapis';
import { parse, Duration } from 'duration-fns';
import { GaxiosResponse } from 'gaxios';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Define interfaces for expected API responses (optional but good practice)
interface PlaylistDetails {
    title?: string | null;
    description?: string | null;
    channelTitle?: string | null;
    publishedAt?: string | null;
}

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

    // --- Fetch Playlist Details ---
    let playlistDetails: PlaylistDetails = {};
    try {
        const playlistInfoResponse: GaxiosResponse<youtube_v3.Schema$PlaylistListResponse> = await youtube.playlists.list({
             part: ['snippet'],
             id: [playlistId],
             maxResults: 1,
        });
        if (playlistInfoResponse.data.items && playlistInfoResponse.data.items.length > 0) {
            const snippet = playlistInfoResponse.data.items[0].snippet;
            playlistDetails = {
                title: snippet?.title,
                description: snippet?.description,
                channelTitle: snippet?.channelTitle,
                publishedAt: snippet?.publishedAt,
            };
        } else {
             // Handle case where playlist ID is valid but no details found (maybe deleted?)
             // We can still proceed to try and fetch items, but good to note.
             console.warn(`Could not fetch details for playlist ID: ${playlistId}`);
        }
    } catch (detailsError: any) {
        // Log error fetching details, but continue to try fetching items
        console.error(`Error fetching playlist details for ${playlistId}:`, detailsError.message);
         // If the error is specifically 'playlistNotFound', we can probably stop here
         if (detailsError.response?.data?.error?.errors?.[0]?.reason === 'playlistNotFound') {
            return NextResponse.json({ error: 'Playlist not found. Check the URL or playlist privacy settings.' }, { status: 404 });
         }
    }
    // --- End Fetch Playlist Details ---


    let videoIds: string[] = [];
    let nextPageToken: string | undefined | null = undefined;

    // 1. Fetch all video IDs from the playlist (handling pagination)
    do {
      // Add explicit type for playlistResponse
      const playlistResponse: GaxiosResponse<youtube_v3.Schema$PlaylistItemListResponse> = await youtube.playlistItems.list({
        part: ['contentDetails'],
        playlistId: playlistId,
        maxResults: 50, // Max allowed by API
        pageToken: nextPageToken ?? undefined,
      });

      const currentVideoIds = playlistResponse.data.items
        // Add explicit type for item
        ?.map((item: youtube_v3.Schema$PlaylistItem) => item.contentDetails?.videoId)
        // Add explicit type for id
        .filter((id: string | null | undefined): id is string => !!id) ?? [];

      videoIds = videoIds.concat(currentVideoIds);
      nextPageToken = playlistResponse.data.nextPageToken;

    } while (nextPageToken);

    const videoCount = videoIds.length; // Store video count

    if (videoCount === 0) {
        // Return details even if no videos found
        return NextResponse.json({
            ...playlistDetails, // Include fetched details
            videoCount: 0,
            totalWatchTime: "0:00",
            averageDuration: "0:00",
            totalSeconds: 0,
        });
    }

    // 2. Fetch video details (durations) for all video IDs (in batches of 50)
    let totalSeconds = 0;
    const videoDetailsPromises: Promise<GaxiosResponse<youtube_v3.Schema$VideoListResponse>>[] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
        const videoIdBatch = videoIds.slice(i, i + 50);
        videoDetailsPromises.push(
            youtube.videos.list({
                part: ['contentDetails'], // We only need contentDetails for duration
                id: videoIdBatch,
                maxResults: 50,
            })
        );
    }

    const videoDetailsResponses: GaxiosResponse<youtube_v3.Schema$VideoListResponse>[] = await Promise.all(videoDetailsPromises);

    videoDetailsResponses.forEach((response) => { // Add type
        response.data.items?.forEach((item: youtube_v3.Schema$Video) => { // Add type
            const durationString = item.contentDetails?.duration;
            if(durationString) {
                 totalSeconds += parseISO8601Duration(durationString);
            }
        });
    });


    // 3. Format the total duration & Calculate Average
    const formattedTotalDuration = formatDuration(totalSeconds);
    const averageSeconds = videoCount > 0 ? totalSeconds / videoCount : 0;
    const formattedAverageDuration = formatDuration(averageSeconds);

    return NextResponse.json({
      ...playlistDetails, // Include playlist details
      videoCount: videoCount,
      totalWatchTime: formattedTotalDuration,
      averageDuration: formattedAverageDuration, // Add average duration
      totalSeconds: totalSeconds
    });

  } catch (error: any) {
    console.error('Error fetching playlist info:', error);

    // Check for specific Google API errors
    if (error.response?.data?.error) {
        const ytError = error.response.data.error;
        console.error('YouTube API Error Details:', JSON.stringify(ytError, null, 2));
        // Provide a more specific error message if possible
        let message = `YouTube API Error: ${ytError.message || 'Unknown error'}`;
        if (ytError.errors?.length > 0) {
            const reason = ytError.errors[0].reason;
            message = `YouTube API Error (${reason}): ${ytError.errors[0].message}`;
             // Handle specific common errors
             if (reason === 'playlistNotFound') {
                return NextResponse.json({ error: 'Playlist not found. Check the URL or playlist privacy settings.' }, { status: 404 });
            }
             if (reason === 'forbidden') {
                 return NextResponse.json({ error: 'Access forbidden. The playlist might be private or deleted.' }, { status: 403 });
             }
             if (reason === 'keyInvalid') {
                 return NextResponse.json({ error: 'Invalid API Key. Please check server configuration.' }, { status: 400 });
             }
             if (reason === 'quotaExceeded' || reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded') {
                 return NextResponse.json({ error: 'API Quota Exceeded. Please try again later.' }, { status: 429 });
             }
        }
        // Use status from error response if available, otherwise default to 500
        const status = typeof error.response.status === 'number' ? error.response.status : 500;
        return NextResponse.json({ error: message }, { status: status });
    }

    // Generic fallback error
    return NextResponse.json({ error: 'Failed to fetch playlist information due to an unexpected server error.' }, { status: 500 });
  }
} 