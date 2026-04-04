const fs = require("fs");
const fetch = require("node-fetch");

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

async function getAccessToken() {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: REFRESH_TOKEN,
        }),
    });

    const data = await response.json();
    return data.access_token;
}

async function getRecentlyPlayed(token) {
    const res = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=5",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await res.json();
    return data.items;
}

function formatTracks(tracks) {
    return tracks
        .map((item) => {
            const name = item.track.name;
            const artist = item.track.artists.map((a) => a.name).join(", ");
            return `- 🎵 ${name} — ${artist}`;
        })
        .join("\n");
}

async function updateReadme() {
    const token = await getAccessToken();
    const tracks = await getRecentlyPlayed(token);

    const formatted = formatTracks(tracks);

    const readme = fs.readFileSync("README.md", "utf-8");

    const newSection = `
## 🎧 Últimas músicas ouvidas

${formatted}
`;

    const updated = readme.replace(
        /## 🎧 Últimas músicas ouvidas[\s\S]*?(?=\n##|$)/,
        newSection
    );

    fs.writeFileSync("README.md", updated);
}

updateReadme();