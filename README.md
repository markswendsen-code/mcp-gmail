# @striderlabs/mcp-gmail

MCP server that gives AI agents the ability to send, read, and search email via Gmail.

## Installation

```bash
npx @striderlabs/mcp-gmail
```

## Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "strider-gmail": {
      "command": "npx",
      "args": ["-y", "@striderlabs/mcp-gmail"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "GOOGLE_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

## Available Tools

### gmail_send
Send an email from the user's Gmail account.

**Parameters:**
- `to` (required): Recipient email address
- `subject` (required): Email subject line
- `body` (required): Email body content
- `cc` (optional): CC recipients
- `bcc` (optional): BCC recipients

### gmail_search
Search emails using Gmail search syntax.

**Parameters:**
- `query` (required): Gmail search query (e.g., "from:example@gmail.com")
- `maxResults` (optional): Maximum results (default: 10)

### gmail_read
Read the full content of a specific email.

**Parameters:**
- `messageId` (required): The Gmail message ID

### gmail_list
List recent emails from the inbox.

**Parameters:**
- `maxResults` (optional): Maximum emails to list (default: 10)
- `label` (optional): Filter by label (e.g., "INBOX", "UNREAD")

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Gmail API
4. Create OAuth 2.0 credentials
5. Use the OAuth playground or your app to get a refresh token

## Response Format

All tools return structured JSON:

```json
{
  "success": true,
  "messageId": "...",
  "message": "Email sent successfully"
}
```

## Part of Strider Labs

Strider Labs builds action execution infrastructure for AI agents.

- Website: https://striderlabs.ai
- GitHub: https://github.com/striderlabs

## License

MIT
