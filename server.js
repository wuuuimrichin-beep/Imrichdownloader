const express = require("express");
const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const app = express();
app.use(express.json());
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

const QUALITY = {
  best: "bv*+ba/b",
  "1080": "bv*[height<=1080]+ba/b[height<=1080]",
  "720": "bv*[height<=720]+ba/b[height<=720]",
  "480": "bv*[height<=480]+ba/b[height<=480]",
  audio: "ba/b",
};
const TIME_RE = /^\d+(:\d{1,2}){0,2}(\.\d+)?$/;

const toSec = (t) => t.split(":").reduce((a, p) => a * 60 + parseFloat(p), 0);
const cleanUrl = (u) => (/^https?:\/\//i.test((u || "").trim()) ? u.trim() : null);

app.post("/api/info", (req, res) => {
  const url = cleanUrl(req.body.url);
  if (!url) return res.status(400).json({ error: "Please enter a valid video URL." });
  execFile("yt-dlp", ["--js-runtimes", "node", "--no-playlist", "-J", "--", url], { maxBuffer: 50 * 1024 * 1024 }, (err, out, stderr) => {
    if (err) return res.status(400).json({ error: (stderr || err.message).slice(-300) });
    const d = JSON.parse(out);
    res.json({ title: d.title, duration: d.duration, thumbnail: d.thumbnail });
  });
});

app.post("/api/download", (req, res) => {
  const { start = "", end = "", quality = "best" } = req.body;
  const url = cleanUrl(req.body.url);
  if (!url) return res.status(400).json({ error: "Please enter a valid video URL." });
  const s = start.trim(), e = end.trim();
  if ((s && !TIME_RE.test(s)) || (e && !TIME_RE.test(e)))
    return res.status(400).json({ error: "Invalid time format. For example, enter 5:00." });
  if (s && e && toSec(e) <= toSec(s))
    return res.status(400).json({ error: "The end time must be later than the start time." });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clipcut_"));
  const cleanup = () => fs.rm(tmp, { recursive: true, force: true }, () => {});
  const args = [
    "--js-runtimes", "node",
    "--no-playlist", "-f", QUALITY[quality] || QUALITY.best,
    "-o", path.join(tmp, "%(title).80B.%(ext)s"),
    "--merge-output-format", "mp4",
  ];
  if (s || e) args.push("--download-sections", `*${s || "0"}-${e || "inf"}`, "--force-keyframes-at-cuts");
  if (quality === "audio") args.push("-x", "--audio-format", "mp3");
  args.push("--", url);

  execFile("yt-dlp", args, { maxBuffer: 50 * 1024 * 1024 }, (err, _o, stderr) => {
    const files = fs.readdirSync(tmp);
    if (err || !files.length) {
      cleanup();
      return res.status(400).json({ error: (stderr || "Download failed.").slice(-300) });
    }
    res.download(path.join(tmp, files[0]), files[0], cleanup);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("ClipCut is running at http://localhost:" + PORT));
