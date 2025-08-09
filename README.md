This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configuration (Wunderground / Weather.com PWS)

The app fetches live data server‑side from the Weather Underground (Weather.com PWS) API. Add the following environment variables:

- `WU_API_KEY`: your Weather.com API key
- `WU_STATION_ID`: your PWS station ID (e.g. `IXXXXXXX`)

Local development:

1. Create a `.env.local` file in the project root with:

   ```env
   WU_API_KEY=your_api_key
   WU_STATION_ID=your_station_id
   ```

2. Start the dev server. The client calls `/api/weather/latest` and `/api/weather/history`, which read these variables only on the server.

Vercel deployment:

1. In Vercel → Project → Settings → Environment Variables, add `WU_API_KEY` and `WU_STATION_ID` for Development, Preview, and Production.
2. Redeploy. Secrets are not exposed to the client; only server routes access them.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
