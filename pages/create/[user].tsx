import Head from "next/head";
import Image from "next/image";
import styles from "../../styles/bouquet.module.css";
import React, { useState, useEffect } from "react";
import Recent from "./recent";
import { useRouter } from "next/router";
// ... (import statements and interface definitions)

// Emoji Picker component that fetches emojis from the database
const EmojiPicker = ({
  onEmojiClick,
}: {
  onEmojiClick: (emoji: string) => void;
}) => {
  const [emojis, setEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    // Fetch the most recent emojis from the database
    const fetchEmojis = async () => {
      try {
        setLoading(true);
        setError(null);
        setDbStatus(null);

        const limit = showMore ? 48 : 12; // 4x more emojis when showing more
        const response = await fetch(`/api/getCommonEmojis?limit=${limit}`);
        if (response.ok) {
          const data = await response.json();

          // Check if the response is the new format with error information
          if (data && typeof data === "object" && "emojis" in data) {
            setEmojis(data.emojis);
            if (data.error) {
              setDbStatus(data.error);
              console.warn("Database issue:", data.error, data.details);
            }
          } else if (Array.isArray(data)) {
            // Old format - just an array of emojis
            setEmojis(data);
            if (data.length === 0) {
              setError("No emojis found in the database");
            }
          } else {
            console.error("Unexpected response format:", data);
            setError("Received unexpected data format from server");
          }
        } else {
          try {
            const errorData = await response.json();
            console.error("Failed to fetch emojis:", errorData);
            setError(
              `Failed to fetch emojis: ${errorData.message || "Unknown error"}`
            );
          } catch (e) {
            setError(
              `Failed to fetch emojis: ${response.status} ${response.statusText}`
            );
          }
        }
      } catch (error) {
        console.error("Error fetching emojis:", error);
        setError("Error connecting to the server");
      } finally {
        setLoading(false);
      }
    };

    fetchEmojis();
  }, [showMore]);

  if (loading) {
    return <div className={styles.emojiPicker}>Loading emojis...</div>;
  }

  if (error) {
    return <div className={styles.emojiPicker}>{error}</div>;
  }

  if (emojis.length === 0) {
    return <div className={styles.emojiPicker}>No emojis found</div>;
  }

  return (
    <div className={styles.emojiPicker}>
      {dbStatus && (
        <div className={styles.dbStatus}>
          <small>{dbStatus}</small>
        </div>
      )}
      {emojis.map((emoji, index) => (
        <button
          key={index}
          className={styles.emojiButton}
          onClick={() => onEmojiClick(emoji)}
          type="button"
        >
          {emoji}
        </button>
      ))}
      <button
        className={styles.moreButton}
        onClick={() => setShowMore(!showMore)}
        type="button"
      >
        {showMore ? 'Less' : 'More'}
      </button>
    </div>
  );
};

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

  // Handle emoji click from the picker
  const handleEmojiClick = (emoji: string) => {
    // Update the text field with the selected emoji
    setTextField({
      ...textField,
      description: textField.description
        ? `${emoji} ${textField.description
            .replace(textField.emoji, "")
            .trim()}`
        : emoji,
      emoji: emoji,
    });
  };

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
    // Using a different approach to detect emojis to avoid the ES6 flag issue
    const emojiRegex =
      /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]|[\u2300-\u23FF]|[\u2B50-\u2B55]/g;
    const hasEmoji = emojiRegex.test(value);

    // Find the first emoji in the string if it contains an emoji
    let newEmoji = textField.emoji;
    if (hasEmoji) {
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
        {/* Emoji Picker */}
        <EmojiPicker onEmojiClick={handleEmojiClick} />

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
