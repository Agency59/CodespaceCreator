import { createServer } from "node:http";
import { App, createNodeMiddleware } from "octokit";
import { configuration } from "./utils/configuration.js";

// On créé une nouvelle instance d'application
// grâce au "SDK" fourni par Github.
const app = new App(configuration);

// On écoute les événements correspondant à une issue ouverte.
// A chaque fois qu'on reçoit un événement, on reçoit dans notre
// callback deux variables:
//  1. Octokit qui permet d'accéder à un module REST authentifié
//.    scopé sur l'événement que l'on a reçu
//  2. Payload qui contient un objet représentant l'événement.
app.webhooks.on("issues.opened", async ({ octokit, payload }) => {
  console.log("event received!", payload.action);

  // Nos variables sont "typées" par
  // le sdk Octokit fourni par
  // Github
  const repository = payload.repository;
  const issue = payload.issue;

  // Si l'issue n'a aucun "label",
  // on ajoute le label "needs triage"
  if (!issue.labels?.length) {
    await octokit.rest.issues.addLabels({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
      labels: ["needs triage"],
    });
  }
  return "ok";
});

// On fait "écouter" notre application sur le port 3000.
// En interne, l'application exposera une route "/api/github/webhooks"
// qui permettra d'irriguer les différentes fonctions en événement.
// Exactement comme dans l'exemple qu'on a plus haut sur un
// événement qui écoute une "opened issue".
createServer(createNodeMiddleware(app)).listen(process.env.PORT ?? 3000);
