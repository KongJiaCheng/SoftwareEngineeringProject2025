"use client";

import { useState } from "react";
import { Box, VStack } from "@chakra-ui/layout";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Button } from "@chakra-ui/button";
import { useToast } from "@chakra-ui/toast";

// export default function LoginPage() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const toast = useToast();

//   const handleLogin = async () => {
//     if (!username || !password) {
//       toast({ title: "Please fill fields", status: "warning" });
//       return;
//     }

//     try {
//       const res = await fetch("/api/auth/token/", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password }),
//       });

//       if (!res.ok) {
//         toast({ title: "Login failed", status: "error" });
//         return;
//       }

//       const data = await res.json();
//       sessionStorage.setItem("access", data.access);
//       toast({ title: "Logged in", status: "success" });
//       window.location.href = "/";
//     } catch (error) {
//       console.error(error);
//       toast({ title: "An error occurred", status: "error" });
//     }
//   };

//   return (
//     <Box
//       bgImage='url("/picture/Background.jpg")'
//       bgSize="cover"
//       minH="100vh"
//       display="flex"
//       alignItems="center"
//       justifyContent="center"
//       color="white"
//     >
//       <Box bg="rgba(0,0,0,0.7)" p={8} borderRadius="md" width="400px">
//         <VStack gap={4}>
//           <FormControl>
//             <FormLabel>Username</FormLabel>
//             <Input
//               bg="white"
//               color="black"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//             />
//           </FormControl>
//           <FormControl>
//             <FormLabel>Password</FormLabel>
//             <Input
//               bg="white"
//               color="black"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />
//           </FormControl>
//           <Button colorScheme="green" width="100%" onClick={handleLogin}>
//             Login
//           </Button>
//         </VStack>
//       </Box>
//     </Box>
//   );
// }

// export default async function Home() {
//   const res = await fetch("/api/hello", { cache: "no-store" });
//   const data = await res.json();

//   return (
//     <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
//       <h1 style={{ fontSize: 28, marginBottom: 8 }}>Pattern B Demo (JS)</h1>

//       <p>
//         Message from Django via Next.js BFF: <b>{data.message}</b>
//       </p>

//       <hr style={{ margin: "16px 0" }} />

//       <p>Try the uploader (accepts images/videos/.glb):</p>
//       <form action="/api/upload" method="POST" encType="multipart/form-data">
//         <input name="files" type="file" multiple />
//         <button type="submit" style={{ marginLeft: 8 }}>Upload</button>
//       </form>
//     </main>
//   );
// }

// added 3/11/2025
export default async function Home() {
  const res = await fetch("/api", { cache: "no-store" });
  const data = await res.json();

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Pattern B Demo (JS)</h1>

      <p>
        Message from Django via Next.js BFF: <b>{data.message}</b>
      </p>

      <hr style={{ margin: "16px 0" }} />

      <p>Try the uploader (accepts images/videos/.glb):</p>
      <form action="/api/upload_download" method="POST" encType="multipart/form-data">
        <input name="files" type="file" multiple />
        <button type="submit" style={{ marginLeft: 8 }}>Upload</button>
      </form>
    </main>
  );
}
// added 3/11/2025