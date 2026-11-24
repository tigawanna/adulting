/**
 * Forwards Solid server-function requests to the Vite SSR bundle.
 * Static HTML/assets are served from dist/client; only /_server hits this.
 */
export default async (request) => {
  const { default: app } = await import("../../dist/server/server.js");
  return app.fetch(request);
};

export const config = {
  path: "/_server*",
};
