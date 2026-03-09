#!/usr/bin/env node

/**
 * Strider Labs Gmail MCP Server
 * 
 * MCP server that gives AI agents the ability to send, read, and search email.
 * https://striderlabs.ai
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";

// Initialize server
const server = new Server(
  {
    name: "strider-gmail",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// OAuth2 client setup
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN environment variables."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function getGmailClient() {
  const auth = getOAuth2Client();
  return google.gmail({ version: "v1", auth });
}

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "gmail_send",
        description:
          "Send an email from the user's Gmail account. Use this when the user wants to send an email to someone.",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient email address",
            },
            subject: {
              type: "string",
              description: "Email subject line",
            },
            body: {
              type: "string",
              description: "Email body content (plain text)",
            },
            cc: {
              type: "string",
              description: "CC recipients (comma-separated, optional)",
            },
            bcc: {
              type: "string",
              description: "BCC recipients (comma-separated, optional)",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "gmail_search",
        description:
          "Search emails in the user's Gmail inbox using Gmail search syntax. Use this to find specific emails.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                'Gmail search query (e.g., "from:example@gmail.com subject:meeting")',
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results to return (default: 10)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "gmail_read",
        description:
          "Read the full content of a specific email by its message ID.",
        inputSchema: {
          type: "object",
          properties: {
            messageId: {
              type: "string",
              description: "The Gmail message ID to read",
            },
          },
          required: ["messageId"],
        },
      },
      {
        name: "gmail_list",
        description:
          "List recent emails from the inbox. Use this to see what emails the user has received.",
        inputSchema: {
          type: "object",
          properties: {
            maxResults: {
              type: "number",
              description: "Maximum number of emails to list (default: 10)",
            },
            label: {
              type: "string",
              description: 'Filter by label (e.g., "INBOX", "UNREAD", "STARRED")',
            },
          },
        },
      },
    ],
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const gmail = getGmailClient();

    switch (name) {
      case "gmail_send": {
        const { to, subject, body, cc, bcc } = args as {
          to: string;
          subject: string;
          body: string;
          cc?: string;
          bcc?: string;
        };

        const messageParts = [
          `To: ${to}`,
          cc ? `Cc: ${cc}` : "",
          bcc ? `Bcc: ${bcc}` : "",
          `Subject: ${subject}`,
          "Content-Type: text/plain; charset=utf-8",
          "",
          body,
        ].filter(Boolean);

        const rawMessage = Buffer.from(messageParts.join("\r\n"))
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: rawMessage },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                messageId: response.data.id,
                threadId: response.data.threadId,
                message: `Email sent successfully to ${to}`,
              }),
            },
          ],
        };
      }

      case "gmail_search": {
        const { query, maxResults = 10 } = args as {
          query: string;
          maxResults?: number;
        };

        const response = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults,
        });

        const messages = [];
        for (const msg of response.data.messages || []) {
          const full = await gmail.users.messages.get({
            userId: "me",
            id: msg.id!,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const headers = full.data.payload?.headers || [];
          messages.push({
            id: msg.id,
            threadId: msg.threadId,
            from: headers.find((h) => h.name === "From")?.value || "",
            subject: headers.find((h) => h.name === "Subject")?.value || "",
            date: headers.find((h) => h.name === "Date")?.value || "",
            snippet: full.data.snippet || "",
          });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                count: messages.length,
                messages,
              }),
            },
          ],
        };
      }

      case "gmail_read": {
        const { messageId } = args as { messageId: string };

        const response = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "full",
        });

        const headers = response.data.payload?.headers || [];
        let body = "";
        const payload = response.data.payload;

        if (payload?.body?.data) {
          body = Buffer.from(payload.body.data, "base64").toString("utf-8");
        } else if (payload?.parts) {
          const textPart = payload.parts.find(
            (p) => p.mimeType === "text/plain"
          );
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: {
                  id: response.data.id,
                  threadId: response.data.threadId,
                  from: headers.find((h) => h.name === "From")?.value || "",
                  to: headers.find((h) => h.name === "To")?.value || "",
                  subject:
                    headers.find((h) => h.name === "Subject")?.value || "",
                  date: headers.find((h) => h.name === "Date")?.value || "",
                  body,
                  labels: response.data.labelIds || [],
                },
              }),
            },
          ],
        };
      }

      case "gmail_list": {
        const { maxResults = 10, label } = args as {
          maxResults?: number;
          label?: string;
        };

        const response = await gmail.users.messages.list({
          userId: "me",
          maxResults,
          labelIds: label ? [label] : undefined,
        });

        const messages = [];
        for (const msg of response.data.messages || []) {
          const full = await gmail.users.messages.get({
            userId: "me",
            id: msg.id!,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const headers = full.data.payload?.headers || [];
          messages.push({
            id: msg.id,
            threadId: msg.threadId,
            from: headers.find((h) => h.name === "From")?.value || "",
            subject: headers.find((h) => h.name === "Subject")?.value || "",
            date: headers.find((h) => h.name === "Date")?.value || "",
            snippet: full.data.snippet || "",
          });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                count: messages.length,
                messages,
              }),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Unknown tool: ${name}`,
              }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: errorMessage,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Strider Gmail MCP server running");
}

main().catch(console.error);
