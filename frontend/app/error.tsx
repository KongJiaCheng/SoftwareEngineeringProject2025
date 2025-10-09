"use client";

export default function Error({ error }: { error: Error }) {
  console.error(error);
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <p>{error.message}</p>
      </body>
    </html>
  );
}
