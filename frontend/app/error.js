"use client";

export default function Error({ error, reset }) {
  console.error(error);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

