# Matushka GitHub Pages Site

This directory contains the GitHub Pages website for Matushka, a Russian language teaching materials collector.

## Files

- **index.html** - Main configuration generator page
- **styles.css** - Professional, responsive styling
- **app.js** - Interactive form functionality and config generation
- **config-schema.json** - JSON Schema for configuration validation
- **legal.html** - Legal information and terms of use

## Features

The web interface allows users to:

- Configure collection preferences (duration, categories, sources, etc.)
- Generate a downloadable `config.json` file
- Access installation instructions
- Review legal disclaimers and terms of use

## GitHub Pages Setup

To enable this site on GitHub Pages:

1. Go to your repository settings
2. Navigate to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Choose the `main` branch and `/docs` folder
5. Click "Save"

Your site will be available at: `https://yourusername.github.io/matushka/`

## Local Development

To test the site locally:

```bash
# Using Python's built-in HTTP server
cd docs
python -m http.server 8000

# Or using Node's http-server
npx http-server docs -p 8000
```

Then visit `http://localhost:8000` in your browser.

## Customization

Before deploying, update the following placeholders:

- Replace `yourusername` with your GitHub username in:
  - index.html (GitHub links)
  - legal.html (GitHub links)
  - config-schema.json ($id field)

## Browser Compatibility

The site is compatible with all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Accessibility

The site includes:
- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Screen reader compatibility
- Responsive design for mobile devices
- High contrast ratios for readability

## License

MIT License - Same as the main Matushka project
