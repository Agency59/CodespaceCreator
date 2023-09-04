import express from "express";
import { Octokit } from "octokit";
import { parse, stringify } from "envfile";
import fs from "node:fs";
import crypto from "node:crypto";

const envFileExists = fs.existsSync(".env");
let currentEnv = {};

if (envFileExists) {
  currentEnv = parse(fs.readFileSync(".env").toString());

  if (
    currentEnv.GH_CLIENT_ID &&
    currentEnv.GH_CLIENT_SECRET &&
    currentEnv.GH_PRIVATE_KEY &&
    currentEnv.GH_APP_ID &&
    currentEnv.GH_WEBHOOK_SECRET
  ) {
    console.log(
      "Dev app is already set, you can start working on the project.",
    );
    process.exit(0);
  }
}

console.log("Generating a new development app...");

const baseUrl = `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`;
const installManifestUrl = `${baseUrl}/generate-dev-app`;
const manifest = {
  name: crypto.randomUUID().split("-").join(""),
  url: "https://www.example.com",
  hook_attributes: {
    url: `${baseUrl}/api/github/webhooks`,
  },
  redirect_url: `${baseUrl}/redirect`,
  callback_urls: [`${baseUrl}/callback`],
  public: true,
  default_permissions: {
    issues: "write",
  },
  default_events: ["issues"],
};

const app = express();
let server;

app.get("/generate-dev-app", (req, res) => {
  res.send(`
        <form id="form" method="post" action="https://github.com/settings/apps/new?state=abc123">
            <input type="hidden" name="manifest" id="manifest">
        </form>

        <script>
        const input = document.getElementById("manifest")
        input.value = JSON.stringify(${JSON.stringify(manifest)})

        const form = document.getElementById('form')
        form.submit()
        </script>
    `);
});

app.get("/redirect", async (req, res, next) => {
  try {
    const code = req.query.code;
    const octokit = new Octokit();

    const { data: response } = await octokit.request(
      "POST /app-manifests/{code}/conversions",
      {
        code,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    currentEnv.GH_APP_ID = response.id;
    currentEnv.GH_CLIENT_ID = response.client_id;
    currentEnv.GH_CLIENT_SECRET = response.client_secret;
    currentEnv.GH_PRIVATE_KEY = response.pem;
    currentEnv.GH_WEBHOOK_SECRET = response.webhook_secret;
    currentEnv.GH_INSTALLATION_URL = response.html_url;

    fs.writeFileSync(".env", stringify(currentEnv));

    res.send(
      `Generated environment! You can <a href="${response.html_url}" target="_blank">click here</a> to install your application on any repository`,
    );
    server.close(() => {
      console.log("successfully generated environment. Happy coding!");
      process.exit(0);
    });
  } catch (error) {
    next(error);
  }
});

server = app.listen(3000, () => {
  console.log(`Access ${installManifestUrl} to get started developing`);
});
