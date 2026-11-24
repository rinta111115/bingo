export const CARD_SIZE = 9;
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

export const winningLines = marks => lines.filter(line => line.every(index => marks[index]));
export const choose = (items, random = Math.random) => items[Math.floor(random() * items.length)];
export function toggleStamp(current, words, random = Math.random) {
  return current ? null : choose(words, random) || 'あたり';
}
