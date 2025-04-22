# YouTube Playlist Analyzer

A web application that calculates the total watch time, average video length, and other statistics for any YouTube playlist.


## Features

- **Total Watch Time**: Calculate the combined duration of all videos in a playlist
- **Video Count**: See how many videos are in the playlist
- **Average Duration**: Get the average length of videos in the playlist
- **Playback Speed Calculations**: See how much time you'll save by watching at 1.25x, 1.5x, 1.75x, or 2x speed
- **Binge-Watching Estimates**: Find out how many days it would take to complete the playlist at different watching rates
- **Human-Readable Time Estimates**: Get easy-to-understand time estimates like "About a week" or "A few hours"
- **Playlist Details**: View playlist title, description, channel, and creation date
- **Elegant Animated UI**: Beautiful animations and transitions throughout the application
- **Simple Interface**: Easy-to-use UI with clear instructions
- **No Login Required**: Analyze any public YouTube playlist instantly
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## How It Works

1. **Copy a YouTube Playlist URL** - Find any public YouTube playlist you want to analyze and copy its URL from your browser's address bar.
2. **Paste URL & Analyze** - Paste the playlist URL into the input field and click "Analyze Playlist" to start the analysis.
3. **Get Detailed Stats** - View comprehensive statistics including total watch time, video count, average video length, and time-saving playback speed options.

Example playlist URL format: `https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxx`

## Technologies Used

- Next.js (React Framework)
- TypeScript
- Tailwind CSS
- Framer Motion (for animations)
- YouTube Data API

## Installation

### Prerequisites

- Node.js (v14.0.0 or later)
- npm or yarn
- YouTube Data API Key

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/youtube-playlist-analyzer.git
   cd youtube-playlist-analyzer
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add your YouTube API key:
   ```
   YOUTUBE_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Production Deployment

To build and start the application for production:

```
npm run build
npm start
# or
yarn build
yarn start
```

## API Endpoints

The application includes the following API endpoint:

- **POST /api/playlist-info** - Accepts a YouTube playlist URL and returns detailed information about the playlist.

  Request body:
  ```json
  {
    "playlistUrl": "https://www.youtube.com/playlist?list=PL..."
  }
  ```

  Response:
  ```json
  {
    "title": "Playlist Title",
    "description": "Playlist Description",
    "channelTitle": "Channel Name",
    "publishedAt": "2023-01-01T00:00:00Z",
    "videoCount": 42,
    "totalWatchTime": "12:34:56",
    "averageDuration": "18:30",
    "totalSeconds": 45296
  }
  ```

## Advanced Analytics

The YouTube Playlist Analyzer provides detailed analytics including:

- **Speed-adjusted watch times**: See how much time you can save by watching at different speeds
- **Binge-watching calculations**: Find out how long it would take to complete the playlist at different daily watching rates
- **Human-readable estimates**: Get intuitive time estimates that are easy to understand
- **Videos per hour**: See how many videos you can watch per hour on average


## Contributing

Contributions are welcome! Please feel free to submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Arnav Malhotra - [arnavmalhotra.com](https://arnavmalhotra.com)

---

Created with ❤️ by [Arnav Malhotra](https://arnavmalhotra.com)
