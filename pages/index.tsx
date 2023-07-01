import React from "react";
import Head from "next/head";

export default function Home(): JSX.Element {
  return (
    <>
      <Head>
        <title>bouquet</title>
        <meta name="description" content="Coming Soon" />
      </Head>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#EFF3E4",
        }}
      >
        <img src="/bouquet.png" alt="bouquet!" className="h-32" />
      </div>
    </>
  );
}
