import { App, initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import serviceAccountKey from "../serviceAccountKey.json";

let app: App;
let serverAuth: Auth;

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: serviceAccountKey.project_id,
      clientEmail: serviceAccountKey.client_email,
      privateKey: serviceAccountKey.private_key,
    }),
  });
  serverAuth = getAuth(app);
} else {
  app = getApp();
  serverAuth = getAuth(app);
}

export { serverAuth };
