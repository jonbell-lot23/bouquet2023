import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

interface Bouquet {
  id: number;
  description: string;
  date: string;
  username: string;
  emoji: string;
}

export default function Home() {
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);

  const router = useRouter();
  const { user } = router.query;

  useEffect(() => {
    async function fetchBouquets() {
      const res = await fetch(`/api/getBouquets?limit=100&user=${user}`);
      const data = await res.json();
      setBouquets(data);
    }
    fetchBouquets();
  }, [user]);

  return (
    <div className="flex items-center justify-center min-h-screen w-md">
      <ul>
        {bouquets.map((bouquet) => (
          <li key={bouquet.id}>
            <div className="bouquetDescription">
              {bouquet.emoji} {bouquet.description}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
