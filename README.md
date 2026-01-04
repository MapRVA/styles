# MapRVA Styles

The `public` folder includes the outputs of `index.js`.
`upload.js` uploads these files to a Cloudflare R2 bucket.

## Build Styles

Make sure to fetch this repository's submodule before continuing.
Requires `docker compose` due to the OpenMapTiles build process.

```
bun run index.js
```

## GitHub Actions Setup

A workflow automatically uploads styles from `public` when you push to the `trunk` branch.
Setting this up requires credentials to a Cloudflare R2 bucket.

Add these secrets to the repository:

- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 API token access key ID
- `R2_SECRET_ACCESS_KEY` - R2 API token secret access key
- `R2_BUCKET_NAME` - Name of R2 bucket
