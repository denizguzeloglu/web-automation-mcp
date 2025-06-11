# Web Automation MCP

A web automation tool built using Model Context Protocol (MCP) that enables browser automation through Claude Desktop.

## Overview

This project provides a comprehensive web automation framework that allows you to:
- Control browser instances programmatically
- Navigate websites and interact with elements
- Extract data from web pages
- Take screenshots
- Manage cookies and sessions
- Handle multiple tabs
- Fill forms automatically

## Features

- **Browser Control**: Launch, navigate, and close browser instances
- **Element Interaction**: Click, type, hover, and interact with page elements
- **Data Extraction**: Get text, links, and table data from pages
- **Screenshot Capture**: Take full page or element-specific screenshots
- **Form Automation**: Fill multiple form fields efficiently
- **Cookie Management**: Get, set, and clear cookies
- **Tab Management**: Open, switch between, and close multiple tabs
- **JavaScript Execution**: Run custom JavaScript in the browser context

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Denizwzb/web-automation-mcp.git
cd web-automation-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

Add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "web-automation": {
      "command": "node",
      "args": ["path/to/web-automation-mcp/build/index.js"]
    }
  }
}
```

## Usage

Once configured, you can use the web automation tools through Claude Desktop to:

- Launch a browser: `launch_browser()`
- Navigate to URLs: `navigate(url)`
- Click elements: `click(selector)`
- Type text: `type_text(selector, text)`
- Take screenshots: `take_screenshot(filename)`
- And much more!

## Development

To contribute to this project:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Requirements

- Node.js 16 or higher
- npm or yarn
- Chrome/Chromium browser

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.