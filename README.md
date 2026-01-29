## Project Setup

```
prisma.io/docs

```

```
https://www.prisma.io/docs/getting-started/prisma-orm/add-to-existing-project/postgresql
```

```
https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql
```

## crud oparation

```
https://www.prisma.io/docs/orm/prisma-client/queries/crud
```

## better Auth

```
https://www.better-auth.com/docs/authentication/google
```

## Node Mailler

```
https://nodemailer.com

```

## console.cloud.google

```
https://console.cloud.google.com/welcome?fbclid=IwY2xjawPHE2pleHRuA2FlbQIxMABicmlkETFoOFR6YlppUzlabHdsVmF3c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHt_94UfJi7mDtqv6vfRP0TAuzP68V5YoNVByUwVybFyKUowwp2N2ixMBDDbg_aem_St_ci-quiBRcCgHnpZlkew&project=heroic-alpha-420707
```

# 1. Create a new project

Create a project directory and navigate into it:

```

mkdir project-name
cd project-name

```

```

npm init -y
npm install typescript tsx @types/node --save-dev
npx tsc --init

```

# 2. Install required dependencies

```

npm install prisma @types/node @types/pg --save-dev
npm install @prisma/client @prisma/adapter-pg pg dotenv

```

# 3. Configure ESM support

# add to file: tsconfig.json

```

{

"compilerOptions": {
"rootDir": "./src",
"outDir": "./dist",
"module": "ESNext",
"moduleResolution": "node",
"target": "ES2023",
"strict": true,
"esModuleInterop": true,
"ignoreDeprecations": "6.0"
}
}

```

```

npm i -D @types/node

```

```

clrt+shift+p --> developer relod window

```

# 4. Initialize Prisma ORM

```

npx prisma init --datasource-provider postgresql --output ../generated/prisma

```

# open

```

.env
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"

You are Entry

Example:
database name : johndoe
passaword : randompassword
mydb: db name

```

```

npm install express
npm install cors

```

```

connect your database

```

# 5. Define your data model

create a model

```

Open prisma/schema.prisma and add the following models:

```

# 6. Create and apply your first migration

```

npx prisma migrate dev --name init

migrations folder created by auto
migrate->migration.sql-> create table

```

```

npx prisma generate
generated folder create auto
gnerated->prisma->model->my model will do a show.

```

# 7. Instantiate Prisma Client

```

CREATE
src/lib/prisma.ts

import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma }

```

# Create src/server.ts

```

import app from "./app";
import { prisma } from "./lib/prisma";
const PORT = process.env.PORT || 5000;

async function main() {
try {
await prisma.$connect();
    console.log("Connected to the database successfully");
    app.listen(PORT, () => {
      console.log(`server is runing on http://localhost:${PORT}`);
});
} catch (error) {
console.error("An error occurred", error);
await prisma.$disconnect();
process.exit(1);
}
}
main();

```

# create src/app.ts

```

import express, { Application } from "express";
const app: Application = express();
app.use(express.json());
app.get("/", (req, res) => {
console.log(res.send("Welcome to Prisma Blog Application API"));
});

export default app;

```

```

run
npx tsx src/server.ts

```

OR

```

run
npx tsx watch src/server.ts

```

# CREATE MODULES PATTRAN

```

Example

src/modules/post

```

# better Auth

```

https://www.better-auth.com/docs/installation

```

## Install the Package

```

npm install better-auth

```

## Set Environment Variables

Secret Key
.env

```

BETTER_AUTH_SECRET=S1ovRXzZzdftVQNVOrRT6x65Kusz5SrW

```

Generate Secret
Set Base URL
.evv

```

BETTER_AUTH_URL=http://localhost:3000 # Base URL of your app

```

create file auth.ts

```

src/lib/auth.ts
auth.ts

import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = new PrismaClient();
export const auth = betterAuth({
database: prismaAdapter(prisma, {
provider: "postgresql",
}),
emailAndPassword: {
enabled: true,
},
});

```

```

npx @better-auth/cli generate
npx prisma migrate dev
-> yes -> auth

```

## Mount Handler

express
use
app.ts

```

import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth"
app.all("/api/auth/\*splat", toNodeHandler(auth));

```

# 8. Write your first query

Create a script.ts file to test your setup:

```

script.ts

```

# 9. Explore your data with Prisma Studio

Prisma Studio is a visual editor for your database. Launch it with:

```

npx prisma studio --config ./prisma.config.ts

```

```

```
