"use client";
import { useState, useEffect } from "react";
import { VectorDB } from "../../utils/entity-db";

// Define types
interface Vector {
  id: number;
  text: string;
  embedding: number[];
  similarity?: number; // Add the similarity property, which is calculated during query
  distance?: number;
}

export default function EntityDbPage() {
  const [queryResult, setQueryResult] = useState<Vector[] | null>(null);
  const [status, setStatus] = useState<string>("");
  const [vectors, setVectors] = useState<Vector[]>([]);
  const [queryTextInput, setQueryTextInput] = useState<string>("");

  // Initialize the VectorDB
  const db = new VectorDB({
    vectorPath: "embedding", // Assuming the vectors are stored in the 'embedding' property
  });

  // Insert vectors (with embedding generation)
  const insertVectors = async () => {
    try {
      const key1 = await db.insert({
        text: "cars", // This will auto-generate embedding
      });
      const key2 = await db.insert({
        text: "dogs",
      });
      const key3 = await db.insert({
        text: "cats",
      });

      setStatus(`Inserted vectors with keys: ${key1}, ${key2}, ${key3}`);
    } catch (error) {
      setStatus(`Error inserting vectors: ${error}`);
    }
  };

  // Insert vectors (with embedding generation)
  const insertBinaryVectors = async () => {
    try {
      const key1 = await db.insertBinary({
        text: "cars", // This will auto-generate embedding
      });
      const key2 = await db.insertBinary({
        text: "dogs",
      });
      const key3 = await db.insertBinary({
        text: "cats",
      });

      setStatus(`Inserted vectors with keys: ${key1}, ${key2}, ${key3}`);
    } catch (error) {
      setStatus(`Error inserting vectors: ${error}`);
    }
  };

  // Insert manual vectors (without text, directly with embeddings)
  const insertManualVectors = async () => {
    try {
      const key4 = await db.insertManualVectors({
        embedding: [1, 2, 3],
        text: "Manual vector",
      });

      setStatus(`Inserted manual vector with key: ${key4}`);
    } catch (error) {
      setStatus(`Error inserting manual vectors: ${error}`);
    }
  };

  // Update a vector
  const updateVector = async () => {
    try {
      const key2 = 2;
      await db.update(key2, {
        embedding: [2, 3, 4],
        text: "Updated text for vector 2",
      });

      setStatus("Updated vector with key: " + key2);
    } catch (error) {
      setStatus(`Error updating vector: ${error}`);
    }
  };

  // Delete a vector
  const deleteVector = async () => {
    try {
      const key3 = 3;
      await db.delete(key3);
      setStatus("Deleted vector with key: " + key3);
    } catch (error) {
      setStatus(`Error deleting vector: ${error}`);
    }
  };

  // Query vectors by cosine similarity based on user-provided text input
  const queryVectors = async () => {
    try {
      if (!queryTextInput.trim()) {
        setStatus("Please enter text to query.");
        return;
      }

      // Convert the query text into embeddings
      const result: Vector[] = await db.query(queryTextInput, { limit: 20 });

      setQueryResult(result);
      setStatus("Query complete.");
    } catch (error) {
      setStatus(`Error querying vectors: ${error}`);
    }
  };

  // Query Binary Vectors using WASM SIMD
  const queryBinaryVectors = async () => {
    try {
      if (!queryTextInput.trim()) {
        setStatus("Please enter text to query.");
        return;
      }

      // Convert the query text into embeddings
      const result: Vector[] = await db.queryBinarySIMD(queryTextInput, {
        limit: 20,
      });

      setQueryResult(result);
      setStatus("Query complete.");
    } catch (error) {
      setStatus(`Error querying vectors: ${error}`);
    }
  };

  useEffect(() => {
    //fetch vectors
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>VectorDB Example</h1>

      <div className="flex gap-4 text-sm">
        <button onClick={insertVectors}>Insert Vectors</button>
        <button onClick={insertBinaryVectors}>Insert Binary Vectors</button>
        <button onClick={insertManualVectors}>Insert Manual Vectors</button>
        <button onClick={updateVector}>Update Vector</button>
        <button onClick={deleteVector}>Delete Vector</button>
        <button onClick={queryVectors}>Query Vectors</button>
        <button onClick={queryBinaryVectors}>Query Binary Vectors</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Status:</h3>
        <p>{status}</p>
      </div>

      <div>
        <h3>Query by Text</h3>
        <input
          type="text"
          value={queryTextInput}
          onChange={(e) => setQueryTextInput(e.target.value)}
          placeholder="Enter text to query"
        />
      </div>

      {queryResult && (
        <div>
          <h3>Query Results:</h3>
          <ul>
            {queryResult.map((item, index) => (
              <li key={index}>
                <strong>ID:</strong> {item.id} | <strong>Text:</strong>{" "}
                {item.text} | <strong>Distance:</strong>{" "}
                {item.distance?.toFixed(4)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3>All Vectors:</h3>
        <ul>
          {vectors.map((vector) => (
            <li key={vector.id}>
              <strong>ID:</strong> {vector.id} | <strong>Text:</strong>{" "}
              {vector.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
