import Head from "next/head";
import Image from "next/image";
import styles from "../../styles/bouquet.module.css";
import React, { useState } from "react";
import Recent from "./recent";
import { useRouter } from "next/router";
// ... (import statements and interface definitions)

interface TextField {
  description: string;
  date: Date;
  username: string;
  emoji: string;
}

interface Bouquet {
  description: string;
  date: Date;
  username: string;
  id: number;
  emoji: string;
}

export default function Home(): React.ReactNode {
  const router = useRouter();
  const { user } = router.query;
  const [textField, setTextField] = useState<TextField>({
    description: "",
    date: new Date(),
    username: user ? user.toString() : "guest",
    emoji: "⚪️",
  });

  const [bouquets, setBouquets] = useState<Bouquet[]>([]);

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    // If the input value is empty, set the textField value to an empty string
    if (value === "") {
      setTextField({
        description: "",
        date: new Date(),
        username: user ? user.toString() : "guest",
        emoji: "⚪️",
      });
      return;
    }

    // Check if the input value contains an emoji
    const hasEmoji = /\p{Emoji}/u.test(value);

    // Find the first emoji in the string if it contains an emoji
    let newEmoji = textField.emoji;
    if (hasEmoji) {
      const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+/g;
      const emojis = value.match(emojiRegex);
      if (emojis) {
        newEmoji = emojis[0];
      }
    } else {
      // If there's no emoji in the value, set the newEmoji to "⚪️"
      newEmoji = "⚪️";
    }

    // Remove emoji from the description, if present
    const descriptionWithoutEmoji = value.replace(newEmoji, "");

    // Add the emoji at the beginning of the description
    const updatedDescription =
      newEmoji !== "⚪️"
        ? `${newEmoji}${
            descriptionWithoutEmoji.startsWith(" ") ? "" : " "
          }${descriptionWithoutEmoji}`
        : descriptionWithoutEmoji;

    setTextField({
      description: updatedDescription,
      date: new Date(),
      username: user ? user.toString() : "guest",
      emoji: newEmoji,
    });

    // Hide the error message if the input value doesn't contain more than one emoji
    if (showError && !value.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length) {
      setShowError(false);
    }
  };

  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false); // add new state variable

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      const { description, username, emoji } = textField;
      const date = new Date(textField.date);

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
        body: JSON.stringify({ description, date, username, emoji }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      setLoading(false); // set loading to false when the response is received

      const newBouquet = await res.json();
      setBouquets([newBouquet, ...bouquets]); // use unshift instead of push

      setTextField({
        description: "",
        date: new Date(),
        username: user ? user.toString() : "guest",
        emoji: "⚪️",
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

        <>
          {loading && (
            <div className={styles.bouquet}>
              <div
                className={styles.bouquetDescription}
                style={{ color: "gray" }}
              >
                {textField.emoji !== "⚪️" ? textField.emoji : "⚪️"}{" "}
                {textField.description.replace(textField.emoji, "").trim()}
              </div>
            </div>
          )}
        </>

        {bouquets.map((bouquet) => (
          <div key={bouquet.id} className={styles.bouquet}>
            <div className={styles.bouquetDescription}>
              {bouquet.emoji} {bouquet.description}
            </div>
          </div>
        ))}

        <div className={styles.bouquet}>
          <Recent />
        </div>
      </div>
    </>
  );
}
