import { App, initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import serviceAccountKey from "serviceAccountKey.json";

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

const bucket = getStorage(app).bucket("shopat-bio.appspot.com");

export function getFileURL(path: string | null | undefined): string | null {
  if (!path) return null;

  return (
    "https://firebasestorage.googleapis.com/v0/b/" +
    bucket.id +
    "/o/" +
    encodeURIComponent(path) +
    "?alt=media"
  );
}

export { serverAuth, bucket };
