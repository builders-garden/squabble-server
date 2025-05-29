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
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const letter = letters[Math.floor(Math.random() * letters.length)];

  const value = LETTER_VALUES[letter];
  return { letter, value };
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
