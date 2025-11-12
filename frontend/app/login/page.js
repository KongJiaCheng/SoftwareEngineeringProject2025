"use client";

import { useState } from "react";
import { Box, VStack } from "@chakra-ui/layout";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Button } from "@chakra-ui/button";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const toast = useToast();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      toast({ title: "Please fill all fields", status: "warning" });
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: data.error || "Login failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // ✅ Store user info in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      toast({
        title: "Login successful",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // ✅ Redirect to /main
      setTimeout(() => {
        router.push("/main");
      }, 1500);
    } catch (error) {
      console.error(error);
      toast({
        title: "An error occurred. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      bgImage='url("/picture/Background.jpg")'
      bgSize="cover"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="white"
    >
      <Box bg="rgba(0,0,0,0.7)" p={8} borderRadius="md" width="400px">
        <VStack gap={4}>
          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input
              bg="white"
              color="black"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              bg="white"
              color="black"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          <Button colorScheme="green" width="100%" onClick={handleLogin}>
            Login
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
