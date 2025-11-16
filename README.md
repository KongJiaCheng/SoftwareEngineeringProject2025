This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Getting Started
## Backend (Setup Virtual Environment and add dependencies)
### go to backend
```bash
cd backend
```
### create Virtual Environment
```bash
python -m venv .venv
```
### start Virtual Environment
```bash
.\.venv\Scripts\Activate.ps1
```
### install dependencies
```bash
pip install -r requirements.txt
```
### Database
#### install postgre and set password to software.

### create database (do this in terminal)
```bash
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres dam_system
```
### Password
```bash
software
```
#### open pgAdmin4 then right-click "dam_system" database and click restore.
#### enter "dam_project.backup" file path and click backup.

### migration
```bash
python manage.py makemigrations
python manage.py migrate
# start server (use everytime to run backend)
python manage.py runserver
```
### paste this url link in the browser: http://127.0.0.1:8000/admin/asset_metadata/assetmetadata/
## Frontend

install dependencies then run development server
```bash
# got to backend
cd frontend
```
```bash
#install dependencies
npm install three "@loaders.gl/core" "@loaders.gl/gltf" "@chakra-ui/react" "@chakra-ui/system" "@emotion/react" "@emotion/styled" framer-motion bcryptjs
#run development server
npm run dev
```

Extra for clearing cache
```bash
# Remove cached Python bytecode
git rm -r --cached **/_pycache_/
git rm -r --cached *.pyc

# Remove Next.js build folders and dependencies
git rm -r --cached .next/
git rm -r --cached node_modules/
git rm -r --cached dist/

# Remove Django migration files (optional – only if you want to regenerate migrations)
git rm -r --cached **/migrations/

# Commit and push cleanup
git commit -m "Remove cached build, pycache, pyc, node_modules, dist, and migrations"
git push
```

Frontend
First, run the development server:

```bash (used Everytime to run frontend)
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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

