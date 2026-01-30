FROM node:22-alpine

WORKDIR /app

# Install dependencies for Prisma and OpenSSL
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
# Since the schema is in a capitalized directory 'Prisma', we specify it
RUN npx prisma generate --schema=./Prisma/schema.prisma

# Create uploads directory if it doesn't exist
RUN mkdir -p uploads

EXPOSE 8080

CMD ["npm","run", "start"]
