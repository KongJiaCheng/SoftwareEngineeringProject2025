"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import dynamic from "next/dynamic";

export function Providers({ children }) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
}

export default dynamic(() => Promise.resolve(UploadPageInternal), { ssr: false });

// "use client";
// import { ChakraProvider } from "@chakra-ui/react";

// export default function Providers({ children }) {
//   return <ChakraProvider>{children}</ChakraProvider>;
// }


import { Button, useColorMode } from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Button onClick={toggleColorMode} leftIcon={colorMode === "light" ? <FiMoon /> : <FiSun />}>
      {colorMode === "light" ? "Dark" : "Light"} Mode
    </Button>
  );
}
