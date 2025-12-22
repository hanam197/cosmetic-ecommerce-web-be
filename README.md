# Cosmetic Ecommerce Web Backend

This is an Express.js backend for a cosmetic ecommerce application.

## Project Structure

```
├── src
│   ├── controllers
│   │   └── sampleController.js
│   ├── middlewares
│   │   └── logger.js
│   ├── routes
│   │   ├── controllerSample.js
│   │   └── sample.js
│   └── index.js
├── .env
├── package.json
├── README.md
```

## Scripts

- `npm run dev` — Start development server with nodemon
- `npm start` — Start production server (if you add the "start" script)

## Requirements

- Node.js (v14 or later recommended)
- npm

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file based on `.env.example` or as below:
   ```env
   PORT=3000
   ```
3. Run server in development mode:
   ```bash
   npm run start
   ```

## Example Endpoints
- `GET /` — Hello, World!
- `GET /sample` — Sample JSON route
- `GET /controller-sample` — Example using controller

---
Modify and expand as needed for your application!

