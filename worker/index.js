self.addEventListener("push", (event) => {
    let payload = {};

    try {
        payload = event.data ? event.data.json() : {};
    } catch {
        payload = {
            title: "Localu",
            body: event.data ? event.data.text() : "You have a new update.",
        };
    }

    const title = payload.title || "Localu";
    const options = {
        body: payload.body || "You have a new update.",
        icon: payload.icon || "/logo2.png",
        badge: payload.badge || "/logo.png",
        tag: payload.tag || "localu-notification",
        data: {
            href: payload.href || "/",
            ...(payload.data || {}),
        },
    };

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            const isFocused = clientList.some((client) => client.focused);

            if (isFocused) {
                // App is active and focused: act as a real-time WebSocket replacement
                clientList.forEach((client) => {
                    client.postMessage({
                        type: "FOREGROUND_NOTIFICATION",
                        payload: { title, ...options },
                    });
                });
                return Promise.resolve();
            } else {
                // App is background/closed: fallback to system notification
                return self.registration.showNotification(title, options);
            }
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const href = event.notification?.data?.href || "/";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            const matchingClient = clients.find((client) => "focus" in client);

            if (matchingClient) {
                matchingClient.navigate(href);
                return matchingClient.focus();
            }

            if (self.clients.openWindow) {
                return self.clients.openWindow(href);
            }

            return undefined;
        })
    );
});
