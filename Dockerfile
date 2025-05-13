# ----------- Build Stage -----------
# Use Node.js Alpine image for the build stage
FROM node:22-alpine AS builder

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install all dependencies including devDependencies (like TypeScript)
RUN npm install

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# ----------- Production Stage -----------
# Use a smaller image for production (no dev dependencies or TS compiler)
FROM node:22-alpine

# Set working directory in production image
WORKDIR /usr/src/app

# Copy only required files from the build stage
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Expose the port the app runs on (adjust as needed)
EXPOSE 3002

# Set the command to run the built app
CMD ["node", "dist/index.js"]
