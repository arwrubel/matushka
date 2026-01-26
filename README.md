# Matushka

A Python-based web scraper and downloader for Russian media content from 1tv.ru. Matushka automates the collection, downloading, and citation of video content for research and educational purposes.

## Features

- Automated content discovery from multiple 1tv.ru sections (news, shows, documentaries)
- Flexible filtering by duration, date range, categories, and sources
- High-quality video and audio downloads using yt-dlp
- Automatic generation of citations in multiple formats (JSON, text, HTML)
- Smart caching to avoid redundant requests
- Configurable sources and content categories
- Metadata extraction and organization
- Selenium-based web scraping with automatic WebDriver management

## Quick Start

1. Clone the repository and navigate to the project directory
2. Install dependencies: `pip install -r requirements.txt`
3. Copy `config/config.example.json` to `config/config.json` and customize
4. Run the scraper: `python main.py`

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/matushka.git
cd matushka

# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt

# Create your configuration file
cp config/config.example.json config/config.json
```

## Usage

### Basic Usage

```bash
# Run with default configuration
python main.py

# Run with verbose output
python main.py --verbose

# Run with custom configuration
python main.py --config path/to/config.json
```

### Configuration

Edit `config/config.json` to customize the scraper behavior. Configuration options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `duration.min_seconds` | Integer | Minimum video duration in seconds | 30 |
| `duration.max_seconds` | Integer | Maximum video duration in seconds | 600 |
| `date_range.days_back` | Integer | How many days back to search | 7 |
| `categories` | Array | Content categories to include | ["news", "culture", "interview"] |
| `sources` | Array | Source IDs to scrape (from sources.json) | ["news-main", "vremya"] |
| `max_items` | Integer | Maximum number of items to download | 50 |
| `output_dir` | String | Directory for downloaded content | "./downloads" |
| `citation_formats` | Array | Citation output formats | ["json", "text", "html"] |
| `cache_enabled` | Boolean | Enable/disable caching | true |
| `verbose` | Boolean | Enable verbose logging | false |

### Available Sources

Sources are defined in `config/sources.json`. Default sources include:

- **news-main**: Main news section
- **vremya**: Vremya news program
- **pozner**: Pozner interview show
- **culture**: Cultural documentaries
- **sports**: Sports coverage
- **dobroe-utro**: Good Morning show
- **segodnya-vecherom**: Tonight show

## Legal Notice

This tool is intended for educational and research purposes only. Users are responsible for:

- Complying with 1tv.ru's terms of service
- Respecting copyright and intellectual property rights
- Using downloaded content in accordance with applicable laws
- Obtaining proper permissions for any public or commercial use

The developers of Matushka do not endorse or encourage copyright infringement. Always respect content creators and rights holders.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows Python best practices and includes appropriate documentation.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
