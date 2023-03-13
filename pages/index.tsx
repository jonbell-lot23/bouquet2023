import Head from "next/head";
import Image from "next/image";
import styles from "../styles/bouquet.module.css";
import React, { useState } from "react";

interface TextField {
  description: string;
  date: string;
  username: string;
}

interface Bouquet {
  description: string;
  date: string;
  username: string;
  id: number;
}

export default function Home(): React.ReactNode {
  const [textField, setTextField] = useState<TextField>({
    description: "",
    date: new Date().toISOString().slice(0, 10),
    username: "Jon",
  });

  const [bouquets, setBouquets] = useState<Bouquet[]>([]);

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    // Check if the input value contains an emoji
    const hasEmoji = /\p{Emoji}/u.test(value);

    // Move the emoji to the start of the string if it contains an emoji
    let newValue = value;
    if (hasEmoji) {
      const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+/g;
      const emojis = value.match(emojiRegex)?.join("") || "";
      newValue = value.replace(emojiRegex, "").trim();
      if (newValue) {
        newValue = `${emojis} ${newValue}`;
      } else {
        newValue = emojis;
      }
    }

    setTextField({
      description: newValue,
      date: new Date().toISOString().slice(0, 10),
      username: "Jon",
    });

    // Hide the error message if the input value doesn't contain more than one emoji
    if (
      showError &&
      !newValue.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length
    ) {
      setShowError(false);
    }
  };

  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false); // add new state variable

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      const { description, date, username } = textField;

      // Check if the input value contains more than one emoji
      const hasMultipleEmojis =
        description.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length > 1;
      if (hasMultipleEmojis) {
        setShowError(true);
        return;
      }

      setLoading(true); // set loading to true before making the fetch call

      const res = await fetch("/api/createBouquet", {
        method: "POST",
        body: JSON.stringify({ description, date, username }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      setLoading(false); // set loading to false when the response is received

      const newBouquet = await res.json();
      setBouquets([...bouquets, newBouquet]);

      setTextField({
        description: "",
        date: new Date().toISOString().slice(0, 10),
        username: "Jon",
      });
    }
  };

  return (
    <>
      <Head>
        <title>Yay! Bouquet!</title>
        <meta name="description" content="Daisy!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@100&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className={styles.container}>
        <div className={styles.textFieldWrapper}>
          <input
            className={styles.textField}
            placeholder="Enter text here..."
            onChange={(event) => handleInput(event)}
            onKeyDown={(event) => handleKeyDown(event)}
            value={textField.description}
          />
        </div>
        <div>
          {showError && (
            <div style={{ color: "red" }}>Please enter only one emoji</div>
          )}
        </div>
        {bouquets.map((bouquet) => (
          <div key={bouquet.id} className={styles.bouquet}>
            <div className={styles.bouquetDescription}>
              {bouquet.description}
            </div>
          </div>
        ))}
        <>
          <div className={styles.bouquet}>
            <div className={styles.bouquetDescription}>
              {loading && (
                <div style={{ color: "gray" }}>{textField.description}</div>
              )}
              {!loading && !bouquets.length && <div></div>}
            </div>
          </div>
        </>
      </div>
    </>
  );
}
