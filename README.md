# @striderlabs/mcp-gmail

MCP server that gives AI agents the ability to send, read, and search email via Gmail.

## For Agents

Agents use this connector to handle email autonomously on behalf of their human — reading important messages, searching for information, composing thoughtful replies, and sending communications.

**Example agent workflows:**

1. **Triage emails:** Agent reads new messages, summarizes important ones, and flags urgent items for user attention
2. **Answer routine questions:** Agent searches email history to find information, composes replies with context from past conversations
3. **Send on behalf:** Agent drafts and sends professional emails based on user intent ("Let the team know I'll be late"), then logs a copy to the conversation

**Usage example:**
> User: "Has anyone replied to my email about the Q2 budget proposal?"

Agent:
1. `gmail_search` → `"to:me subject:budget"`
2. `gmail_read` → Read each message
3. Return summary: "Sarah replied yes on Monday. Mark asked for revisions. No word from Finance yet."

Then agent might automatically draft a follow-up to Finance and ask for approval before sending.

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
