import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const YOUTUBE_SEARCH_URL = process.env.YOUTUBE_BASE_URL;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const searchYoutube = async (params) => {
    const { data } = await axios.get(YOUTUBE_SEARCH_URL, {
        params: {
            key: YOUTUBE_API_KEY,
            part: 'snippet',
            ...params,
        },
    });
    return data?.items || [];
};

// Prefer a full playlist — usually the most complete way to learn a topic end-to-end
const searchPlaylist = async (query) => {
    const items = await searchYoutube({
        q: `${query} complete tutorial`,
        type: 'playlist',
        order: 'relevance',
        maxResults: 5,
    });

    if (!items.length) return null;

    const best = items[0];
    return {
        type: 'playlist',
        title: best.snippet.title,
        playlistId: best.id.playlistId,
        url: `https://www.youtube.com/playlist?list=${best.id.playlistId}`,
    };
};

// Fallback: a single long-form video, filtered to exclude Shorts/clips
const searchLongFormVideo = async (query) => {
    const items = await searchYoutube({
        q: `${query} full course`,
        type: 'video',
        videoDuration: 'long',   // YouTube's own filter: > 20 minutes
        order: 'viewCount',      // favors established, well-watched tutorials
        maxResults: 5,
    });

    if (!items.length) return null;

    const best = items[0];
    return {
        type: 'video',
        title: best.snippet.title,
        videoId: best.id.videoId,
        url: `https://www.youtube.com/watch?v=${best.id.videoId}`,
    };
};

const searchVideo = async (query) => {
    try {
        const playlist = await searchPlaylist(query);
        if (playlist) return [playlist];

        const video = await searchLongFormVideo(query);
        if (video) return [video];

        return null;
    } catch (error) {
        console.error('Error calling YouTube API:', error?.response?.data || error.message);
        return null;
    }
};

export default searchVideo;