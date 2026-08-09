import { FastMCP } from "@prefecthq/fastmcp-ts/server";
import { z } from "zod";

const server = new FastMCP({
  name: "github-server",
  version: "1.0.0",
});

server.tool(
  {
    name: "get_repository",
    description:
      "Get information about a GitHub repository including stars, forks, language and description.",

    input: z.object({
      owner: z.string().describe("GitHub repository owner"),
      repo: z.string().describe("GitHub repository name"),
    }),
  },

  async ({ owner, repo }) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "my-mcp-server",
        },
      }
    );

    if (!response.ok) {
      return {
        content: [
          {
            type: "text",
            text: `GitHub API error: ${response.status}`,
          },
        ],
      };
    }

    const data = await response.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            name: data.full_name,
            description: data.description,
            stars: data.stargazers_count,
            forks: data.forks_count,
            language: data.language,
            openIssues: data.open_issues_count,
            url: data.html_url,
          }),
        },
      ],
    };
  }
);

await server.run();