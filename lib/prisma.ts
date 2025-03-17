import { PrismaClient } from "@prisma/client";

// Add type declaration for global prisma
declare global {
  var prisma: PrismaClient | null;
}

// Define database URLs
const databaseUrls = [
  process.env.DATABASE_URL, // From root .env
  "postgresql://postgres:pifsyb-3bysxa-jozGik@db.cpwdfsfyqknveliapkoo.supabase.co:5432/postgres", // From prisma/.env
];

// Create a global prisma instance
let prisma: PrismaClient;

// Function to create a new Prisma client with a specific URL
const createPrismaClient = (url: string) => {
  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: ["error", "warn"],
  });
};

// Function to test a database connection
const testConnection = async (client: PrismaClient): Promise<boolean> => {
  try {
    await client.$connect();
    // Try a simple query to verify connection
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  } finally {
    await client.$disconnect();
  }
};

// Initialize the global prisma instance
if (process.env.NODE_ENV === "production") {
  // In production, just use the main DATABASE_URL
  prisma = createPrismaClient(databaseUrls[0] || "");
} else {
  // In development, try both URLs
  if (!global.prisma) {
    global.prisma = null;

    // Try to initialize with each URL
    (async () => {
      for (const url of databaseUrls) {
        if (!url) continue;

        const client = createPrismaClient(url);
        const connected = await testConnection(client);

        if (connected) {
          console.log("Successfully connected to database with URL:", url);
          global.prisma = client;
          break;
        }
      }

      // If no connection worked, use the first URL anyway
      if (!global.prisma) {
        console.warn(
          "Could not connect to any database, using first URL as fallback"
        );
        global.prisma = createPrismaClient(databaseUrls[0] || "");
      }
    })();
  }

  prisma = global.prisma || createPrismaClient(databaseUrls[0] || "");
}

export default prisma;
