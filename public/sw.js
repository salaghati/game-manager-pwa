const CACHE_NAME = `game-manager-pwa-v1.0.0-${Date.now()}`;
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // Add other static assets
];

// Install event
self.addEventListener('install', (event) => {
    console.log('📱 PWA Service Worker: Installing...');
    // Force immediate activation
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📱 PWA Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('📱 PWA Service Worker: Cache failed', error);
            })
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip API requests - we want them to always be fresh
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    });
            })
            .catch(() => {
                // Return offline page if available
                if (event.request.destination === 'document') {
                    return caches.match('/offline.html');
                }
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('📱 PWA Service Worker: Activating...');
    // Take control of all clients immediately
    event.waitUntil(
        Promise.all([
            // Delete old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('📱 PWA Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control immediately
            self.clients.claim()
        ])
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('📱 PWA Service Worker: Background sync');
        event.waitUntil(
            // Sync offline data when online
            syncOfflineData()
        );
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Có thông báo mới từ Game Manager',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Xem chi tiết',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Đóng',
                icon: '/icons/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Game Manager', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Sync offline data function
async function syncOfflineData() {
    try {
        // Get offline data from IndexedDB
        // Sync with server when online
        console.log('📱 PWA Service Worker: Syncing offline data...');
    } catch (error) {
        console.error('📱 PWA Service Worker: Sync failed', error);
    }
} 