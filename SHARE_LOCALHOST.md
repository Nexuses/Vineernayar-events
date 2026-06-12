# Share localhost with a Cloudflare public link

Your Next.js app runs at **http://localhost:3000**. To get a public HTTPS link (e.g. `https://something.trycloudflare.com`):

## 1. Install cloudflared (one-time)

**Option A – Homebrew (recommended on Mac):**
```bash
brew install cloudflared
```

**Option B – Direct download (Mac):**
- Apple Silicon: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz
- Intel: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz  

Extract and put `cloudflared` in your PATH (e.g. `mv cloudflared /usr/local/bin/`).

## 2. Start your app (if not already running)

```bash
npm run dev
```

## 3. Start the Cloudflare tunnel

In a **second terminal** (same machine):

```bash
cloudflared tunnel --url http://localhost:3000
```

You’ll see output like:

```
Your quick Tunnel has been created! Visit it at:
https://random-words-here.trycloudflare.com
```

Share that **https://….trycloudflare.com** link; it will forward to your localhost.

- No Cloudflare account needed for quick tunnels.
- The link stays valid until you stop the `cloudflared` command (Ctrl+C).
- Each time you run the command you get a new random URL.
