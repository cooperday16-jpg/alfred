

## Offline mode
The service worker caches the app shell. The viewer keeps last frames + event log + clip metadata in IndexedDB and shows an **Offline · last seen** badge when a peer drops. The camera keeps detecting/recording while offline and queues clips (max 30) for upload when back online. Live video itself cannot be replayed offline—only event clips.
