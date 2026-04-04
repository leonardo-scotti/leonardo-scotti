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

  if (!data.access_token) {
    throw new Error("Erro ao pegar access token: " + JSON.stringify(data));
  }

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

  if (!data.items) {
    console.log("Resposta da API:", data);
      return [];
  }

  return data.items;
}

function formatTracks(tracks) {
  if (!tracks || tracks.length === 0) {
    return "🎧 Nenhuma música recente encontrada.";
  }

  return tracks
    .map((item) => {
      const name = item.track?.name || "Desconhecida";
      const artist =
        item.track?.artists?.map((a) => a.name).join(", ") ||
        "Artista desconhecido";

      return `- 🎵 ${name} — ${artist}`;
    })
    .join("\n");
}

async function updateReadme() {
  try {
    const token = await getAccessToken();
    const tracks = await getRecentlyPlayed(token);

    const formatted = formatTracks(tracks);

    let readme = fs.readFileSync("README.md", "utf-8");

    const sectionTitle = "## 🎧 Últimas músicas ouvidas";

    if (!readme.includes(sectionTitle)) {
      readme += `\n\n${sectionTitle}\n`;
    }

    const newSection = `${sectionTitle}\n\n${formatted}\n`;

    const regex = /## 🎧 Últimas músicas ouvidas[\s\S]*?(?=\n##|$)/;

    const updated = readme.replace(regex, newSection);

    fs.writeFileSync("README.md", updated);

    console.log("README atualizado com sucesso!");
  } catch (error) {
    console.error("Erro geral:", error.message);
    process.exit(1);
  }
}

updateReadme();
