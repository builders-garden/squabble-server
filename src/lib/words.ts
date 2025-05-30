import fs from "fs";
import wordListPath from "word-list";

const LETTER_VALUES: { [key: string]: number } = {
  a: 1,
  e: 1,
  i: 1,
  o: 1,
  u: 1,
  l: 1,
  n: 1,
  s: 1,
  t: 1,
  r: 1,
  d: 2,
  g: 2,
  b: 3,
  c: 3,
  m: 3,
  p: 3,
  f: 4,
  h: 4,
  v: 4,
  w: 4,
  y: 4,
  k: 5,
  j: 8,
  x: 8,
  q: 10,
  z: 10,
};

const words = fs
  .readFileSync(wordListPath, "utf8")
  .split("\n")
  .filter((word) => word.length <= 10);

export const getRandomWord = (minLength = 0, maxLength = 10) => {
  const filteredWords = words.filter(
    (word) => word.length >= minLength && word.length <= maxLength
  );

  if (filteredWords.length === 0) {
    return "";
  }

  return filteredWords[Math.floor(Math.random() * filteredWords.length)];
};

export const getRandomLetter = () => {
  // Create an array of all letters with their weights (inverse of score)
  const weightedLetters = Object.entries(LETTER_VALUES).map(
    ([letter, score]) => ({
      letter,
      weight: 1 / score, // Higher weight for lower scores
    })
  );

  // Calculate total weight
  const totalWeight = weightedLetters.reduce(
    (sum, { weight }) => sum + weight,
    0
  );

  // Generate random number between 0 and total weight
  let random = Math.random() * totalWeight;

  // Find the letter based on weight
  for (const { letter, weight } of weightedLetters) {
    random -= weight;
    if (random <= 0) {
      return { letter, value: LETTER_VALUES[letter] };
    }
  }

  // Fallback (should never reach here)
  return { letter: "e", value: 1 };
};

export const getRandomAvailableLetters = (
  amount: number,
  skipLetters: string[] = []
) => {
  return Array.from({ length: amount }, () => {
    let letter = getRandomLetter();
    while (skipLetters.includes(letter.letter)) {
      letter = getRandomLetter();
    }
    return letter;
  });
};

export const isWordValid = (word: string) => {
  return words.includes(word.toLowerCase());
};

export const computeWordScore = (word: string) => {
  return word
    .split("")
    .reduce((acc, letter) => acc + LETTER_VALUES[letter.toLowerCase()], 0);
};

interface WordInfo {
  word: string;
  isNew: boolean;
  positions: { x: number; y: number }[];
}

export const findWordsAtPosition = (
  board: string[][],
  x: number,
  y: number,
  newPositions: Set<string>
): WordInfo[] => {
  const words: WordInfo[] = [];
  const boardSize = board.length;

  // Check horizontal word
  let horizontalWord = "";
  let startX = x;
  let positions: { x: number; y: number }[] = [];
  // Find the start of the word
  while (startX >= 0 && board[y][startX] !== "") {
    startX--;
  }
  startX++; // Move back to the first letter
  // Build the word
  while (startX < boardSize && board[y][startX] !== "") {
    horizontalWord += board[y][startX];
    positions.push({ x: startX, y });
    startX++;
  }
  if (horizontalWord.length > 1) {
    // Check if any position in this word is part of the new move
    const isNew = positions.some((pos) =>
      newPositions.has(`${pos.x},${pos.y}`)
    );
    words.push({ word: horizontalWord, isNew, positions });
  }

  // Check vertical word
  let verticalWord = "";
  let startY = y;
  positions = [];
  // Find the start of the word
  while (startY >= 0 && board[startY][x] !== "") {
    startY--;
  }
  startY++; // Move back to the first letter
  // Build the word
  while (startY < boardSize && board[startY][x] !== "") {
    verticalWord += board[startY][x];
    positions.push({ x, y: startY });
    startY++;
  }
  if (verticalWord.length > 1) {
    // Check if any position in this word is part of the new move
    const isNew = positions.some((pos) =>
      newPositions.has(`${pos.x},${pos.y}`)
    );
    words.push({ word: verticalWord, isNew, positions });
  }

  return words;
};

export const validateAllWords = (
  board: string[][],
  path: { x: number; y: number }[]
): { isValid: boolean; words: WordInfo[] } => {
  const words: WordInfo[] = [];
  const visitedPositions = new Set<string>();
  const newPositions = new Set(path.map(({ x, y }) => `${x},${y}`));

  // Check each position in the path
  for (const { x, y } of path) {
    const posKey = `${x},${y}`;
    if (!visitedPositions.has(posKey)) {
      const wordsAtPos = findWordsAtPosition(board, x, y, newPositions);
      words.push(...wordsAtPos);
      visitedPositions.add(posKey);
    }
  }

  // Validate all words
  const invalidWords = words.filter((wordInfo) => !isWordValid(wordInfo.word));
  return {
    isValid: invalidWords.length === 0,
    words: words,
  };
};

// Helper to determine if path is horizontal or vertical
export function getPathDirection(
  path: { x: number; y: number }[]
): "horizontal" | "vertical" | null {
  if (path.length < 2) return null;
  const allSameY = path.every((p) => p.y === path[0].y);
  const allSameX = path.every((p) => p.x === path[0].x);
  if (allSameY) return "horizontal";
  if (allSameX) return "vertical";
  return null;
}

// Get the main word formed by the path
export function getMainWord(
  board: string[][],
  path: { x: number; y: number }[]
): string {
  if (path.length === 0) return "";
  const dir = getPathDirection(path);
  if (!dir) return "";
  const { x, y } = path[0];
  if (dir === "horizontal") {
    // Find leftmost
    let startX = Math.min(...path.map((p) => p.x));
    while (startX > 0 && board[y][startX - 1] !== "") startX--;
    let word = "";
    let cx = startX;
    while (cx < board[y].length && board[y][cx] !== "") {
      word += board[y][cx];
      cx++;
    }
    return word;
  } else {
    // vertical
    let startY = Math.min(...path.map((p) => p.y));
    while (startY > 0 && board[startY - 1][x] !== "") startY--;
    let word = "";
    let cy = startY;
    while (cy < board.length && board[cy][x] !== "") {
      word += board[cy][x];
      cy++;
    }
    return word;
  }
}

// Get perpendicular word at a given tile
export function getPerpendicularWord(
  board: string[][],
  x: number,
  y: number,
  dir: "horizontal" | "vertical"
): string | null {
  if (dir === "horizontal") {
    // get vertical word at (x, y)
    let startY = y;
    while (startY > 0 && board[startY - 1][x] !== "") startY--;
    let word = "";
    let cy = startY;
    while (cy < board.length && board[cy][x] !== "") {
      word += board[cy][x];
      cy++;
    }
    return word.length > 1 ? word : null;
  } else {
    // get horizontal word at (x, y)
    let startX = x;
    while (startX > 0 && board[y][startX - 1] !== "") startX--;
    let word = "";
    let cx = startX;
    while (cx < board[y].length && board[y][cx] !== "") {
      word += board[y][cx];
      cx++;
    }
    return word.length > 1 ? word : null;
  }
}

// Get all new words formed by the move (main word + new perpendiculars)
export function getNewWordsFormed(
  board: string[][],
  path: { x: number; y: number }[],
  placedLetters: {x: number; y: number; letter: string }[]
): string[] {
  const dir = getPathDirection(path);
  if (!dir) return [];
  const mainWord = getMainWord(board, path);
  const words = new Set<string>();
  const placedSet = new Set(placedLetters.map(({ x, y }) => `${x},${y}`));

  // Helper to check if a word contains at least one placed tile
  function wordContainsPlacedTile(
    positions: { x: number; y: number }[]
  ): boolean {
    return positions.some((pos) => placedSet.has(`${pos.x},${pos.y}`));
  }

  // Get main word positions
  function getMainWordPositions(): { x: number; y: number }[] {
    if (path.length === 0) return [];
    const { x, y } = path[0];
    const positions: { x: number; y: number }[] = [];
    if (dir === "horizontal") {
      let startX = Math.min(...path.map((p) => p.x));
      while (startX > 0 && board[y][startX - 1] !== "") startX--;
      let cx = startX;
      while (cx < board[y].length && board[y][cx] !== "") {
        positions.push({ x: cx, y });
        cx++;
      }
    } else {
      let startY = Math.min(...path.map((p) => p.y));
      while (startY > 0 && board[startY - 1][x] !== "") startY--;
      let cy = startY;
      while (cy < board.length && board[cy][x] !== "") {
        positions.push({ x, y: cy });
        cy++;
      }
    }
    return positions;
  }

  // Add main word if it uses a placed tile
  if (mainWord.length > 1) {
    const mainPositions = getMainWordPositions();
    if (wordContainsPlacedTile(mainPositions)) {
      words.add(mainWord);
    }
  }

  // For each placed tile, get perpendicular word if it uses a placed tile
  for (const { x, y } of placedLetters) {
    const perp = getPerpendicularWord(board, x, y, dir);
    if (perp) {
      // Get positions for this perpendicular word
      const positions: { x: number; y: number }[] = [];
      if (dir === "horizontal") {
        // vertical word
        let startY = y;
        while (startY > 0 && board[startY - 1][x] !== "") startY--;
        let cy = startY;
        while (cy < board.length && board[cy][x] !== "") {
          positions.push({ x, y: cy });
          cy++;
        }
      } else {
        // horizontal word
        let startX = x;
        while (startX > 0 && board[y][startX - 1] !== "") startX--;
        let cx = startX;
        while (cx < board[y].length && board[y][cx] !== "") {
          positions.push({ x: cx, y });
          cx++;
        }
      }
      if (wordContainsPlacedTile(positions)) {
        words.add(perp);
      }
    }
  }
  return Array.from(words);
}
