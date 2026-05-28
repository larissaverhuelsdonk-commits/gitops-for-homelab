App icon for Budget (favicon, apple-touch-icon).

Replace icon.png with your artwork (square PNG; 512×512 or larger recommended). After changing it, regenerate PWA sizes so the manifest matches real pixels:

  ./scripts/generate-pwa-icons.sh   (macOS)

That writes icon-192.png and icon-512.png, which manifest.webmanifest references for install prompts (Chromium requires correct sizes).
