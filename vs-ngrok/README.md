# VS NGROK

A Visual Studio Code extension that makes it easy to connect to your NGROK tunnel with a custom domain. Features a discrete status bar indicator showing connection status with colored emojis.

## Features

- 🚇 **Status Bar Indicator**: Always visible tunnel emoji that changes color based on connection status
  - 🟢 Green = Connected
  - 🔴 Red = Disconnected
- **Easy Connection Management**: Click the status bar item to connect/disconnect
- **Custom Domain Support**: Use your own NGROK custom domain
- **Secure Configuration**: Store your NGROK API key securely in VS Code settings
- **Quick Actions**: Copy tunnel URL to clipboard with one click
- **Progress Notifications**: See connection progress in real-time

## Requirements

- **NGROK CLI**: You must have [NGROK](https://ngrok.com/download) installed on your system
- **NGROK Account**: You need an NGROK account with:
  - An API key
  - A custom domain (for custom domain functionality)

## Installation

### From VS Code Marketplace (when published)
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "VS NGROK"
4. Click Install

### From Source
1. Clone this repository
2. Run `npm install` in the project directory
3. Run `npm run compile` to build the extension
4. Open the project in VS Code
5. Press F5 to run the extension in a new Extension Development Host window

## Configuration

Before using the extension, you need to configure it:

1. Open VS Code Settings (Ctrl+, / Cmd+,)
2. Search for "VS NGROK"
3. Configure the following settings:
   - **Domain**: Your NGROK custom domain (e.g., `your-domain.ngrok.io`)
   - **API Key**: Your NGROK API key (get it from [NGROK Dashboard](https://dashboard.ngrok.com/api))
   - **Port**: Local port to tunnel (default: 3000)

## Usage

### Connecting to NGROK

1. Click the tunnel status indicator (🔴 🚇) in the status bar
2. Select "Connect Tunnel" from the menu
3. The extension will:
   - Configure NGROK with your API key
   - Start the tunnel to your specified port
   - Update the status indicator to green (🟢 🚇)
   - Show a notification with your tunnel URL

### While Connected

Click the status indicator (🟢 🚇) to:
- **Copy Tunnel URL**: Copy your tunnel URL to clipboard
- **Disconnect Tunnel**: Stop the NGROK tunnel
- **Open Settings**: Quickly access extension settings

### Commands

You can also use these commands from the Command Palette (Ctrl+Shift+P / Cmd+Shift+P):
- `NGROK: Connect Tunnel`
- `NGROK: Disconnect Tunnel`
- `NGROK: Show Status`

## Troubleshooting

### NGROK not found
Make sure NGROK is installed and available in your system PATH. You can verify by running `ngrok version` in your terminal.

### Connection fails
1. Verify your API key is correct
2. Check that your custom domain is properly configured in NGROK
3. Ensure the local port you're trying to tunnel is not already in use
4. Check NGROK logs in the Output panel

### Custom domain not working
Custom domains require a paid NGROK plan. Make sure your account has access to custom domains.

## Development

### Building the Extension
```bash
npm run compile
```

### Watching for Changes
```bash
npm run watch
```

### Packaging for Distribution
```bash
npm install -g @vscode/vsce
vsce package
```

### Publishing
```bash
vsce publish
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License. See the LICENSE file for details. 