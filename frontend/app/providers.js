// porviders.js is used to setup Chakra UI for theming across the app.
"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import dynamic from "next/dynamic";

export function Providers({ children }) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
}

export default dynamic(() => Promise.resolve(UploadPageInternal), { ssr: false });  // This line disables server-side rendering for this component.


import { Button, useColorMode } from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

export function ThemeToggle() { // A simple button to toggle between light and dark mode.
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Button onClick={toggleColorMode} leftIcon={colorMode === "light" ? <FiMoon /> : <FiSun />}>
      {colorMode === "light" ? "Dark" : "Light"} Mode
    </Button>
  );
}
