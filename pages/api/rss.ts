import { NextApiRequest, NextApiResponse } from "next";
import RSS from "rss";
import fetch from "node-fetch";
import { encode } from "entities";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { user } = req.query;
    const now = new Date();
    const startDate = new Date("2023-03-04"); // Define the start date for your weekly digest
    const fourWeeksAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 28
    ); // Changed from 14 to 28 days
    const feed = new RSS({
      title: `${user}'s weekly bouquet`,
      description: "A weekly digest of bouquets",
      feed_url: `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3001"
          : process.env.API_BASE_URL || "http://localhost:3001"
      }/api/rss?user=${user}`,
      site_url: `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3001"
          : process.env.SITE_URL || "http://localhost:3001"
      }/user/${user}`,
      pubDate: now.toISOString(),
    });

    const startWeek = Math.floor(
      (fourWeeksAgo.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    for (let week = startWeek; week <= startWeek + 3; week++) {
      // Changed to include 4 weeks
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + 7 * week);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (weekEndDate < currentDate) {
        // Use localhost:3001 if in development mode or API_BASE_URL isn't set
        const baseUrl =
          process.env.NODE_ENV === "development"
            ? "http://localhost:3001"
            : process.env.API_BASE_URL || "http://localhost:3001";

        const apiUrl = `${baseUrl}/api/getWeeklyDigest?user=${user}&startDate=${weekStartDate.toISOString()}&endDate=${weekEndDate.toISOString()}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const bouquets = await response.json();

        if (bouquets.length === 0) {
          continue;
        }

        const digestContent = bouquets
          .map((bouquet) => `${bouquet.emoji} ${encode(bouquet.description)}`)
          .join("&#10;");

        feed.item({
          title: `@${user}'s weekly bouquet - Week ${week}: ${weekStartDate.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()}`,
          description: digestContent,
          // Use localhost:3001 if in development mode or SITE_URL isn't set
          url: `${
            process.env.NODE_ENV === "development"
              ? "http://localhost:3001"
              : process.env.SITE_URL || "http://localhost:3001"
          }/user/${user}/${weekStartDate.toISOString()}`,
          guid: `${
            process.env.NODE_ENV === "development"
              ? "http://localhost:3001"
              : process.env.SITE_URL || "http://localhost:3001"
          }/user/${user}/${weekStartDate.toISOString()}`,
          author: user,
          date: weekStartDate.toISOString(),
        });
      }
    }

    res.setHeader("Content-Type", "application/rss+xml");
    res.send(feed.xml());
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    res.status(500).json({ message: "Server error" });
  }
}
