import { openDB } from "idb";
import { pipeline } from "@xenova/transformers";
import { env } from "@xenova/transformers";

// Specify a custom location for models (defaults to '/models/').
env.localModelPath = "/huggingface";

// Disable the loading of remote models from the Hugging Face Hub:
// env.allowRemoteModels = false;

// Set location of .wasm files. Defaults to use a CDN.
// env.backends.onnx.wasm.wasmPaths = '/path/to/files/';

//load wasm script
// const wasmBase64 =
//   "AGFzbQEAAAABCAFgA39/fwF/AwIBAAUDAQABBx0CBm1lbW9yeQIAEGhhbW1pbmdfZGlzdGFuY2UAAAqBAQF/AQF/QQAhAwJAA0AgAkUEQAwCCyADIAD9AAQAIAH9AAQA/VH9GwBpIAD9AAQAIAH9AAQA/VH9GwFpIAD9AAQAIAH9AAQA/VH9GwJpIAD9AAQAIAH9AAQA/VH9GwNpampqaiEDIABBEGohACABQRBqIQEgAkEQayECDAALCyADCwA2BG5hbWUBEwEAEGhhbW1pbmdfZGlzdGFuY2UCGgEABAAEcHRyQQEEcHRyQgIDbGVuAwRkaXN0";

//wasm script with logs
const wasmBase64 =
  "AGFzbQEAAAABDAJgAX8AYAN/f38BfwILAQNlbnYDbG9nAAADAgEBBQMBAAEHHQIGbWVtb3J5AgAQaGFtbWluZ19kaXN0YW5jZQABCoYBAYMBAQF/QQAhAwJAA0AgAkUEQAwCCyAAEAAgAyAA/QAEACAB/QAEAP1R/RsAaSAA/QAEACAB/QAEAP1R/RsBaSAA/QAEACAB/QAEAP1R/RsCaSAA/QAEACAB/QAEAP1R/RsDaWpqamohAyAAQRBqIQAgAUEQaiEBIAJBEGshAgwACwsgAwsAPQRuYW1lARgCAANsb2cBEGhhbW1pbmdfZGlzdGFuY2UCHAIAAAEEAARwdHJBAQRwdHJCAgNsZW4DBGRpc3Q=";
function base64ToUint8Array(base64) {
  if (typeof window !== "undefined") {
    // Browser: Use atob to decode Base64
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } else {
    // Node.js: Use Buffer to decode Base64
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }
}

async function loadWasm() {
  const wasmBinary = base64ToUint8Array(wasmBase64); // Decode Base64
  const wasmModule = await WebAssembly.instantiate(wasmBinary, {
    env: {
      memory: new WebAssembly.Memory({ initial: 1 }),
      log: (ptr) => console.log(`Processing pointer at offset: ${ptr}`),
    },
  });

  // Check if memory is exported; if not, use the imported memory
  const memory =
    wasmModule.instance.exports.memory ||
    wasmModule.instance.exports.env.memory;

  if (!memory) {
    throw new Error("WebAssembly module does not export or provide memory.");
  }

  return {
    ...wasmModule.instance.exports,
    memory, // Ensure memory is included
  };
}

// Default pipeline (Xenova/all-MiniLM-L6-v2)
const defaultModel = "Xenova/all-MiniLM-L6-v2";
const pipePromise = pipeline("feature-extraction", defaultModel);

// Cosine similarity function
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce(
    (sum, val, index) => sum + val * vecB[index],
    0
  );
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// Function to get embeddings from text using HuggingFace pipeline
const getEmbeddingFromText = async (text, model = defaultModel) => {
  const pipe = await pipePromise;
  const output = await pipe(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
};

// Binarizer function for dense vectors
const binarizeVector = (vector, threshold = null) => {
  if (threshold === null) {
    const sorted = [...vector].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    threshold =
      sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
  }
  return vector.map((val) => (val >= threshold ? 1 : 0));
};

const hammingDistance = (vectorA, vectorB) => {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must be of the same length");
  }
  const length = vectorA.length;
  const bitsA = new BigUint64Array(vectorA.buffer);
  const bitsB = new BigUint64Array(vectorB.buffer);

  let distance = 0n;
  for (let i = 0; i < bitsA.length; i++) {
    const xorResult = bitsA[i] ^ bitsB[i];
    distance += BigInt(xorResult.toString(2).replace(/0/g, "").length); // Popcount equivalent
  }
  return Number(distance);
};

class VectorDB {
  constructor({ vectorPath, model = defaultModel }) {
    this.vectorPath = vectorPath;
    this.model = model;
    this.dbPromise = this._initDB();
  }

  // Initialize the IndexedDB
  async _initDB() {
    const db = await openDB("VectorDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("vectors")) {
          db.createObjectStore("vectors", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });
    return db;
  }

  // Insert data by generating embeddings from text
  async insert(data) {
    try {
      // Generate embedding if text is provided
      let embedding = data[this.vectorPath];
      if (data.text) {
        embedding = await getEmbeddingFromText(data.text, this.model);
      }

      const db = await this.dbPromise;
      const transaction = db.transaction("vectors", "readwrite");
      const store = transaction.objectStore("vectors");
      const record = { vector: embedding, ...data };
      const key = await store.add(record);
      return key;
    } catch (error) {
      throw new Error(`Error inserting data: ${error}`);
    }
  }

  async insertBinary(data) {
    try {
      let embedding = data[this.vectorPath];
      if (data.text) {
        embedding = await getEmbeddingFromText(data.text, this.model);
      }

      // Binarize the embedding and pack into BigUint64Array
      const binaryEmbedding = binarizeVector(embedding);
      const packedEmbedding = new BigUint64Array(
        new ArrayBuffer(Math.ceil(binaryEmbedding.length / 64) * 8)
      );
      for (let i = 0; i < binaryEmbedding.length; i++) {
        const bitIndex = i % 64;
        const arrayIndex = Math.floor(i / 64);
        if (binaryEmbedding[i] === 1) {
          packedEmbedding[arrayIndex] |= 1n << BigInt(bitIndex);
        }
      }

      const db = await this.dbPromise;
      const transaction = db.transaction("vectors", "readwrite");
      const store = transaction.objectStore("vectors");
      const record = { vector: packedEmbedding, ...data };
      const key = await store.add(record);
      return key;
    } catch (error) {
      throw new Error(`Error inserting binary data: ${error}`);
    }
  }

  // Insert manual vectors (no embedding generation, just insert provided vectors)
  async insertManualVectors(data) {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction("vectors", "readwrite");
      const store = transaction.objectStore("vectors");
      const record = { vector: data[this.vectorPath], ...data };
      const key = await store.add(record);
      return key;
    } catch (error) {
      throw new Error(`Error inserting manual vectors: ${error}`);
    }
  }

  // Update an existing vector in the database
  async update(key, data) {
    const db = await this.dbPromise;
    const transaction = db.transaction("vectors", "readwrite");
    const store = transaction.objectStore("vectors");
    const vector = data[this.vectorPath];
    const updatedData = { vector, ...data };
    await store.put(updatedData);
  }

  // Delete a vector by key
  async delete(key) {
    const db = await this.dbPromise;
    const transaction = db.transaction("vectors", "readwrite");
    const store = transaction.objectStore("vectors");
    await store.delete(key);
  }

  // Query vectors by cosine similarity (using a text input that will be converted into embeddings)
  async query(queryText, { limit = 10 } = {}) {
    try {
      // Get embeddings for the query text
      const queryVector = await getEmbeddingFromText(queryText, this.model);

      const db = await this.dbPromise;
      const transaction = db.transaction("vectors", "readonly");
      const store = transaction.objectStore("vectors");
      const vectors = await store.getAll(); // Retrieve all vectors

      // Calculate cosine similarity for each vector and sort by similarity
      const similarities = vectors.map((entry) => {
        const similarity = cosineSimilarity(queryVector, entry.vector);
        return { ...entry, similarity };
      });

      similarities.sort((a, b) => b.similarity - a.similarity); // Sort by similarity (descending)
      return similarities.slice(0, limit); // Return the top N results based on limit
    } catch (error) {
      throw new Error(`Error querying vectors: ${error}`);
    }
  }

  //Query binarized vectors using Hamming distance nstead of cosine similarity
  async queryBinary(queryText, { limit = 10 } = {}) {
    try {
      // Get embeddings and binarize them
      const queryVector = await getEmbeddingFromText(queryText, this.model);
      const binaryQueryVector = binarizeVector(queryVector);

      // Pack the query vector into BigUint64Array
      const packedQueryVector = new BigUint64Array(
        new ArrayBuffer(Math.ceil(binaryQueryVector.length / 64) * 8)
      );
      for (let i = 0; i < binaryQueryVector.length; i++) {
        const bitIndex = i % 64;
        const arrayIndex = Math.floor(i / 64);
        if (binaryQueryVector[i] === 1) {
          packedQueryVector[arrayIndex] |= 1n << BigInt(bitIndex);
        }
      }

      const db = await this.dbPromise;
      const transaction = db.transaction("vectors", "readonly");
      const store = transaction.objectStore("vectors");
      const vectors = await store.getAll();

      // Calculate Hamming distance
      const distances = vectors.map((entry) => {
        const distance = hammingDistance(packedQueryVector, entry.vector);
        return { ...entry, distance };
      });

      // Sort by Hamming distance (ascending)
      distances.sort((a, b) => a.distance - b.distance);

      // Return the top N results based on limit
      return distances.slice(0, limit);
    } catch (error) {
      throw new Error(`Error querying binary vectors: ${error}`);
    }
  }

  /*The WebAssembly SIMD implementation processes 128 bits per iteration (via v128.xor) 
  compared to 64 bits per iteration in the JavaScript implementation using BigUint64Array.
  This alone gives a theoretical 2x speedup.SIMD instructions execute XOR, popcount, and 
  similar operations on multiple data lanes in parallel. 
  
  This reduces the number of CPU cycles required for the same amount of work compared to 
  sequential bitwise operations in JavaScript. SIMD in WebAssembly is likely 2x to 4x 
  faster or more over big vectors.
  */
  async queryBinarySIMD(queryText, { limit = 10 } = {}) {
    try {
      const queryVector = await getEmbeddingFromText(queryText, this.model);
      const binaryQueryVector = binarizeVector(queryVector);

      const packedQueryVector = new BigUint64Array(
        new ArrayBuffer(Math.ceil(binaryQueryVector.length / 64) * 8)
      );
      for (let i = 0; i < binaryQueryVector.length; i++) {
        const bitIndex = i % 64;
        const arrayIndex = Math.floor(i / 64);
        if (binaryQueryVector[i] === 1) {
          packedQueryVector[arrayIndex] |= 1n << BigInt(bitIndex);
        }
      }

      console.log(
        "Query Vector (binary):",
        [...packedQueryVector].map((v) => v.toString(2))
      );

      const db = await this.dbPromise;
      const transaction = db.transaction("vectors", "readonly");
      const store = transaction.objectStore("vectors");
      const vectors = await store.getAll();

      vectors.forEach((entry, index) => {
        console.log(
          `DB Vector ${index} (binary):`,
          [...new BigUint64Array(entry.vector.buffer)].map((v) => v.toString(2))
        );
      });

      const wasmModule = await loadWasm();
      const { hamming_distance, memory } = wasmModule;

      if (!memory) {
        throw new Error("WebAssembly memory is undefined.");
      }

      const wasmMemory = new Uint8Array(memory.buffer);
      wasmMemory.set(new Uint8Array(packedQueryVector.buffer), 0);

      const distances = vectors.map((entry) => {
        const dbVector = new Uint8Array(entry.vector.buffer);
        wasmMemory.set(dbVector, 16);
        const distance = hamming_distance(0, 16, packedQueryVector.length * 8);
        return { ...entry, distance };
      });

      distances.sort((a, b) => a.distance - b.distance);
      return distances.slice(0, limit);
    } catch (error) {
      console.error("Error querying binary vectors:", error);
      throw error;
    }
  }

  // Query manual vectors directly (query pre-computed embeddings)
  async queryManualVectors(queryVector, { limit = 10 } = {}) {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction("vectors", "readonly");
      const store = transaction.objectStore("vectors");
      const vectors = await store.getAll(); // Retrieve all vectors

      // Calculate cosine similarity for each vector and sort by similarity
      const similarities = vectors.map((entry) => {
        const similarity = cosineSimilarity(queryVector, entry.vector);
        return { ...entry, similarity };
      });

      similarities.sort((a, b) => b.similarity - a.similarity); // Sort by similarity (descending)
      return similarities.slice(0, limit); // Return the top N results based on limit
    } catch (error) {
      throw new Error(`Error querying manual vectors: ${error}`);
    }
  }
}

// Export VectorDB class
export { VectorDB };
