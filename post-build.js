#!/usr/bin/env node
/**
 * post-build.js
 *
 * Ran automatically by `npm run build` (via postbuild hook).
 * Replaces the generic push handler in the auto-generated public/sw.js
 * with the smart foreground/background handler that fires a postMessage
 * when the app is open (acting as a WebSocket replacement) and falls back
 * to a system OS notification when the app is minimised or closed.
 */
const fs = require("fs");
const path = require("path");

const swPath = path.join(__dirname, "public", "sw.js");

if (!fs.existsSync(swPath)) {
  console.log("[post-build] public/sw.js not found — skipping patch.");
  process.exit(0);
}

let content = fs.readFileSync(swPath, "utf8");

const OLD_HANDLER = `  event.waitUntil(self.registration.showNotification(title, options));
});`;

const NEW_HANDLER = `  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      var isFocused = clientList.some(function(client) { return client.focused; });
      if (isFocused) {
        // App is open — send postMessage so the React app shows an instant toast
        clientList.forEach(function(client) {
          client.postMessage({ type: "FOREGROUND_NOTIFICATION", payload: Object.assign({ title: title }, options) });
        });
        return Promise.resolve();
      } else {
        // App is in background or closed — show OS-level notification
        return self.registration.showNotification(title, options);
      }
    })
  );
});`;

if (content.includes(OLD_HANDLER)) {
  const patched = content.replace(OLD_HANDLER, NEW_HANDLER);
  fs.writeFileSync(swPath, patched, "utf8");
  console.log("[post-build] ✅ public/sw.js patched with foreground/background push handler.");
} else if (content.includes("FOREGROUND_NOTIFICATION")) {
  console.log("[post-build] ✅ public/sw.js already contains foreground handler — no patch needed.");
} else {
  console.warn("[post-build] ⚠️  Could not find the expected push handler in public/sw.js. Patch was NOT applied. Please update post-build.js.");
}
