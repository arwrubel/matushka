# Matushka

**A free, browser-based tool for Russian language educators to discover, download, and cite teaching materials.**

## Use It Now

**[https://arwrubel.github.io/matushka](https://arwrubel.github.io/matushka)**

No installation required. Just visit the site and start collecting materials.

## Features

- **Browser-Based** - No software to install, works on any device
- **Smart Filtering** - Filter by duration (30s-10min), date range, and content categories
- **Multiple Sources** - News, Vremya, Pozner, culture, sports, and more from 1tv.ru
- **One-Click Downloads** - Select videos and download audio files directly
- **Legal Citations** - Auto-generate citations in Chicago, MLA, APA, BibTeX, or JSON formats
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode** - Easy on the eyes

## How It Works

1. **Visit the site** at [arwrubel.github.io/matushka](https://arwrubel.github.io/matushka)
2. **Set your filters** - duration, date range, categories, sources
3. **Click "Search for Content"** - browse available videos
4. **Select the ones you want** - check the boxes
5. **Download** - audio files save to your computer
6. **Export Citations** - get properly formatted citations for your materials

## For Educators

This tool was built specifically for Russian language teachers who need authentic media content for classroom instruction. All downloaded materials include complete source attribution to ensure proper academic citation.

### Citation Formats

- **Chicago** - Standard academic format
- **MLA** - Modern Language Association style
- **APA** - American Psychological Association style
- **BibTeX** - For LaTeX documents
- **JSON** - Machine-readable format

## Available Sources

| Source | Description |
|--------|-------------|
| Main News | General news coverage |
| Vremya | Flagship evening news program |
| Pozner | Interview show |
| Culture | Cultural content |
| Sports | Sports coverage |
| Dobroe Utro | Morning show |
| Segodnya Vecherom | Evening entertainment |

## Self-Hosting

Want to run your own instance? The project uses:

- **Frontend**: Static HTML/CSS/JS (GitHub Pages)
- **Backend**: Cloudflare Worker (free tier: 100k requests/day)

### Deploy Your Own

1. Fork this repository
2. Create a free [Cloudflare](https://cloudflare.com) account
3. Go to Workers & Pages > Create > Create Worker
4. Paste the contents of `worker/worker.js`
5. Update `docs/app.js` line 24 with your worker URL
6. Enable GitHub Pages (Settings > Pages > Deploy from branch > main > /docs)

See `worker/README.md` for detailed API documentation.

## Legal Notice

This tool is intended for **educational purposes only**. Users are responsible for:

- Complying with source websites' terms of service
- Respecting copyright and intellectual property rights
- Using downloaded content in accordance with applicable laws
- Providing proper attribution when using materials

Content remains the property of original creators. This tool facilitates discovery and proper citation of publicly available materials for educational use.

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please open an issue or pull request.
