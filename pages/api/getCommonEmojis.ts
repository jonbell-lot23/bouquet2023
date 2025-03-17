import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the limit from query params or default to 12
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 12;

    // Log for debugging
    console.log(`Fetching exactly ${limit} recent unique emojis from database`);

    // Test database connection first
    try {
      await prisma.$connect();
      console.log("Successfully connected to the database");
    } catch (connectionError) {
      console.error("Database connection error:", connectionError);
      // Return a helpful error message with fallback emojis
      return res.status(200).json({
        emojis: [
          "😊",
          "😂",
          "❤️",
          "🙏",
          "😍",
          "🥰",
          "😘",
          "👍",
          "✨",
          "🎉",
          "🔥",
          "💕",
        ],
        error: "Database connection failed. Using fallback emojis.",
        details:
          connectionError instanceof Error
            ? connectionError.message
            : String(connectionError),
      });
    }

    // Get the most recent emojis from bouquet2023 table
    const recentBouquet2023Emojis = await prisma.bouquet2023.findMany({
      where: {
        emoji: {
          not: null,
        },
        AND: {
          emoji: {
            not: "⚪️", // Exclude default emoji
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      select: {
        emoji: true,
      },
      take: 200, // Get more than we need to ensure we have enough unique ones
    });

    console.log(
      `Found ${recentBouquet2023Emojis.length} emojis from bouquet2023`
    );

    // Also get recent emojis from bouquet_emoji_lookup
    const recentEmojiLookups = await prisma.bouquet_emoji_lookup.findMany({
      where: {
        emoji: {
          not: null,
        },
        AND: {
          emoji: {
            not: "⚪️", // Exclude default emoji
          },
        },
      },
      orderBy: {
        id: "desc", // Assuming id is auto-incremented and represents recency
      },
      select: {
        emoji: true,
      },
      take: 200, // Get more than we need to ensure we have enough unique ones
    });

    console.log(
      `Found ${recentEmojiLookups.length} emojis from bouquet_emoji_lookup`
    );

    // Extract emojis (filtering already done in the query)
    const bouquet2023EmojiList = recentBouquet2023Emojis.map(
      (item) => item.emoji as string
    );

    const emojiLookupList = recentEmojiLookups.map(
      (item) => item.emoji as string
    );

    // Combine and deduplicate while preserving order (most recent first)
    const uniqueEmojis: string[] = [];

    // Process both lists to get unique emojis
    for (const emoji of [...bouquet2023EmojiList, ...emojiLookupList]) {
      if (!uniqueEmojis.includes(emoji)) {
        uniqueEmojis.push(emoji);
        if (uniqueEmojis.length >= limit) {
          break;
        }
      }
    }

    console.log(`Returning ${uniqueEmojis.length} unique emojis`);

    // If we don't have enough emojis from the database, add some common ones
    if (uniqueEmojis.length < limit) {
      console.log(
        "Not enough emojis found in database, adding some common ones"
      );
      const commonEmojis = [
        "😊",
        "😂",
        "❤️",
        "🙏",
        "😍",
        "🥰",
        "😘",
        "👍",
        "✨",
        "🎉",
        "🔥",
        "💕",
      ];

      for (const emoji of commonEmojis) {
        if (!uniqueEmojis.includes(emoji)) {
          uniqueEmojis.push(emoji);
          if (uniqueEmojis.length >= limit) {
            break;
          }
        }
      }
    }

    // Return the unique emojis from the database
    return res.status(200).json(uniqueEmojis.slice(0, limit));
  } catch (error) {
    console.error("Error fetching recent emojis:", error);
    // Return a helpful error message with fallback emojis
    return res.status(200).json({
      emojis: [
        "😊",
        "😂",
        "❤️",
        "🙏",
        "😍",
        "🥰",
        "😘",
        "👍",
        "✨",
        "🎉",
        "🔥",
        "💕",
      ],
      error: "Error fetching emojis. Using fallback emojis.",
      details: error instanceof Error ? error.message : String(error),
    });
  } finally {
    // Disconnect from the database to prevent connection pool issues
    await prisma.$disconnect();
  }
}
