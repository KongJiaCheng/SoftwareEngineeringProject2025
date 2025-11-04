"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  HStack,
  Heading,
  useToast,
} from "@chakra-ui/react";

export default function MainPage() {
  const [metadata, setMetadata] = useState([]);
  const [search, setSearch] = useState("");
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState(null);
  const router = useRouter();
  const toast = useToast();

  const API_URL = "http://127.0.0.1:8000/api/metadata/";

  // ✅ Load user session
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      router.push("/login");
      return;
    }
    fetchMetadata();
  }, []);

  // ✅ Fetch metadata from Django
  const fetchMetadata = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setMetadata(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to load metadata", status: "error" });
    }
  };

  // ✅ Add new metadata
  const addMetadata = async () => {
    if (!fileName) return toast({ title: "File name required", status: "warning" });
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: fileName, description }),
      });
      if (res.ok) {
        toast({ title: "Metadata added", status: "success" });
        setFileName("");
        setDescription("");
        fetchMetadata();
      }
    } catch (error) {
      toast({ title: "Add failed", status: "error" });
    }
  };

  // ✅ Edit metadata
  const editMetadata = async (id) => {
    try {
      const res = await fetch(`${API_URL}${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: fileName, description }),
      });
      if (res.ok) {
        toast({ title: "Metadata updated", status: "success" });
        setSelected(null);
        setFileName("");
        setDescription("");
        fetchMetadata();
      }
    } catch (error) {
      toast({ title: "Update failed", status: "error" });
    }
  };

  // ✅ Delete metadata
  const deleteMetadata = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch(`${API_URL}${id}/`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", status: "info" });
        fetchMetadata();
      }
    } catch (error) {
      toast({ title: "Delete failed", status: "error" });
    }
  };

  // ✅ Filter by search
  const filtered = metadata.filter(
    (item) =>
      item.file_name.toLowerCase().includes(search.toLowerCase()) ||
      item.tags?.join(",").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={8} bg="gray.50" minH="100vh">
      <Heading mb={6}>Metadata Management</Heading>

      {/* Search + Logout */}
      <HStack mb={4} spacing={4}>
        <Input
          placeholder="Search by name or tag"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          bg="white"
        />
        <Button
          onClick={() => {
            localStorage.removeItem("user");
            router.push("/login");
          }}
          colorScheme="red"
        >
          Logout
        </Button>
      </HStack>

      {/* Add/Edit Form */}
      <VStack bg="white" p={4} mb={6} rounded="md" spacing={3} shadow="sm">
        <Input
          placeholder="File Name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
        <Input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {selected ? (
          <Button colorScheme="blue" onClick={() => editMetadata(selected.id)}>
            Update Metadata
          </Button>
        ) : (
          <Button colorScheme="green" onClick={addMetadata}>
            Add Metadata
          </Button>
        )}
      </VStack>

      {/* Metadata Table */}
      <Table variant="simple" bg="white" rounded="md" shadow="sm">
        <Thead bg="gray.100">
          <Tr>
            <Th>File Name</Th>
            <Th>Description</Th>
            <Th>Tags</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filtered.map((item) => (
            <Tr key={item.id}>
              <Td>{item.file_name}</Td>
              <Td>{item.description}</Td>
              <Td>{item.tags?.join(", ")}</Td>
              <Td>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    colorScheme="yellow"
                    onClick={() => {
                      setSelected(item);
                      setFileName(item.file_name);
                      setDescription(item.description || "");
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => deleteMetadata(item.id)}
                  >
                    Delete
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
