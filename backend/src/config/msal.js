const msal = require('@azure/msal-node');

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
};

const REDIRECT_URI =
  process.env.AZURE_REDIRECT_URI ||
  'http://localhost:3001/api/auth/microsoft/callback';

const GRAPH_SCOPES = ['user.read'];

let confidentialClient = null;

function getMsalClient() {
  if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_TENANT_ID) {
    return null;
  }
  if (!confidentialClient) {
    confidentialClient = new msal.ConfidentialClientApplication(msalConfig);
  }
  return confidentialClient;
}

module.exports = { getMsalClient, GRAPH_SCOPES, REDIRECT_URI };
