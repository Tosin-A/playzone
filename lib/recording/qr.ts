/**
 * Tiny dependency-free QR encoder (Model 2, ECC level M, version 1-10).
 * Produces a boolean matrix that the share card renders as squares.
 *
 * Adapted from Project Nayuki's QR-Code-generator (MIT license),
 * pared down to the bytes we actually need.
 */

type Bit = 0 | 1;
type Matrix = boolean[][];

// Galois field tables for Reed-Solomon
const EXP_TABLE: number[] = new Array(256);
const LOG_TABLE: number[] = new Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 256; i++) {
    EXP_TABLE[i] = x;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function rsGenerator(degree: number): number[] {
  let result = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(result.length + 1).fill(0);
    for (let j = 0; j < result.length; j++) {
      next[j] ^= gfMul(result[j], 1);
      next[j + 1] ^= gfMul(result[j], EXP_TABLE[i]);
    }
    result = next;
  }
  return result;
}

function rsRemainder(data: number[], generator: number[]): number[] {
  const remainder = new Array(generator.length - 1).fill(0);
  for (const b of data) {
    const factor = b ^ remainder.shift()!;
    remainder.push(0);
    for (let i = 0; i < generator.length - 1; i++) {
      remainder[i] ^= gfMul(generator[i + 1], factor);
    }
  }
  return remainder;
}

// Version-1-to-10 table for ECC level M: [version, data codewords, ec codewords per block, blocks]
const ECC_M_TABLE: [number, number, number, number][] = [
  [1, 16, 10, 1],
  [2, 28, 16, 1],
  [3, 44, 26, 1],
  [4, 64, 18, 2],
  [5, 86, 24, 2],
  [6, 108, 16, 4],
  [7, 124, 18, 4],
  [8, 154, 22, 4],
  [9, 182, 22, 5],
  [10, 216, 26, 5],
];

function pickVersion(byteLen: number): [number, number, number, number] {
  // mode (4) + length (8 or 16) + data (byteLen*8) + terminator (4)
  for (const row of ECC_M_TABLE) {
    const totalDataBits = row[1] * 8;
    const lengthBits = row[0] < 10 ? 8 : 16;
    const usedBits = 4 + lengthBits + byteLen * 8 + 4;
    if (usedBits <= totalDataBits) return row;
  }
  throw new Error("QR: payload too large for version 10");
}

function bitsToBytes(bits: Bit[]): number[] {
  while (bits.length % 8 !== 0) bits.push(0);
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    out.push(b);
  }
  return out;
}

function encodeByteSegment(data: Uint8Array, version: number): Bit[] {
  const bits: Bit[] = [];
  // Mode indicator: byte mode = 0100
  [0, 1, 0, 0].forEach((b) => bits.push(b as Bit));
  // Character count
  const lenBits = version < 10 ? 8 : 16;
  for (let i = lenBits - 1; i >= 0; i--) bits.push(((data.length >> i) & 1) as Bit);
  // Data bytes
  for (const b of data) {
    for (let i = 7; i >= 0; i--) bits.push(((b >> i) & 1) as Bit);
  }
  return bits;
}

function placeFunctionPatterns(size: number, modules: Matrix, isFunction: boolean[][]) {
  // Finder patterns at three corners
  const placeFinder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        isFunction[y][x] = true;
        const a = Math.max(Math.abs(dx), Math.abs(dy));
        modules[y][x] = a !== 2 && a !== 4;
      }
    }
  };
  placeFinder(3, 3);
  placeFinder(size - 4, 3);
  placeFinder(3, size - 4);

  // Separators are blank by default (already false). Mark as function.
  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
    isFunction[6][i] = true;
    isFunction[i][6] = true;
  }
  // Dark module
  modules[size - 8][8] = true;
  isFunction[size - 8][8] = true;
  // Reserve format info area
  for (let i = 0; i <= 8; i++) {
    isFunction[8][i] = true;
    isFunction[i][8] = true;
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }
}

function placeAlignmentPattern(modules: Matrix, isFunction: boolean[][], cx: number, cy: number) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      isFunction[y][x] = true;
      const a = Math.max(Math.abs(dx), Math.abs(dy));
      modules[y][x] = a !== 1;
    }
  }
}

// Alignment pattern centers per version (subset 1-10)
const ALIGN_POS: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

function placeAlignmentPatterns(version: number, size: number, modules: Matrix, isFunction: boolean[][]) {
  const positions = ALIGN_POS[version];
  for (const px of positions) {
    for (const py of positions) {
      // Skip overlap with finders
      if ((px === 6 && py === 6) || (px === 6 && py === size - 7) || (px === size - 7 && py === 6)) continue;
      placeAlignmentPattern(modules, isFunction, px, py);
    }
  }
}

function placeData(size: number, modules: Matrix, isFunction: boolean[][], dataBits: Bit[]) {
  let bitIdx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && bitIdx < dataBits.length) {
          modules[y][x] = dataBits[bitIdx] === 1;
          bitIdx++;
        }
      }
    }
  }
}

function applyMask(modules: Matrix, isFunction: boolean[][], size: number, mask: number) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isFunction[y][x]) continue;
      let invert = false;
      switch (mask) {
        case 0: invert = (x + y) % 2 === 0; break;
        case 1: invert = y % 2 === 0; break;
        case 2: invert = x % 3 === 0; break;
        case 3: invert = (x + y) % 3 === 0; break;
        case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
        case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
      }
      if (invert) modules[y][x] = !modules[y][x];
    }
  }
}

function placeFormatBits(modules: Matrix, size: number, mask: number) {
  // ECC level M = 00; mask = 3 bits
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;

  for (let i = 0; i <= 5; i++) modules[8][i] = ((bits >> i) & 1) === 1;
  modules[8][7] = ((bits >> 6) & 1) === 1;
  modules[8][8] = ((bits >> 7) & 1) === 1;
  modules[7][8] = ((bits >> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) modules[14 - i][8] = ((bits >> i) & 1) === 1;

  for (let i = 0; i < 8; i++) modules[size - 1 - i][8] = ((bits >> i) & 1) === 1;
  for (let i = 8; i < 15; i++) modules[8][size - 15 + i] = ((bits >> i) & 1) === 1;
  modules[size - 8][8] = true;
}

/**
 * Generate a QR matrix for the given URL.
 * Returns a 2D boolean array where true = dark module.
 */
export function generateQR(text: string): boolean[][] {
  const data = new TextEncoder().encode(text);
  const [version, dataCodewords, ecCodewords, blocks] = pickVersion(data.length);
  const size = 17 + version * 4;

  // Build data bit stream
  const bits = encodeByteSegment(data, version);
  // Terminator
  const totalBits = dataCodewords * 8;
  for (let i = 0; i < Math.min(4, totalBits - bits.length); i++) bits.push(0);
  // Pad to bytes
  const dataBytes = bitsToBytes(bits);
  // Pad bytes
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataBytes.length < dataCodewords) {
    dataBytes.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // ECC interleaving (simplified: single block group for v1-10 in ECC_M_TABLE)
  // For these versions, blocks always 1 or split evenly.
  const shortBlockLen = Math.floor(dataCodewords / blocks);
  const longBlockCount = dataCodewords % blocks;
  const blocksData: number[][] = [];
  const blocksEc: number[][] = [];
  const generator = rsGenerator(ecCodewords);
  let offset = 0;
  for (let i = 0; i < blocks; i++) {
    const len = shortBlockLen + (i >= blocks - longBlockCount ? 1 : 0);
    const block = dataBytes.slice(offset, offset + len);
    offset += len;
    blocksData.push(block);
    blocksEc.push(rsRemainder(block, generator));
  }
  // Interleave
  const interleavedBytes: number[] = [];
  const maxDataLen = Math.max(...blocksData.map((b) => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const b of blocksData) {
      if (i < b.length) interleavedBytes.push(b[i]);
    }
  }
  for (let i = 0; i < ecCodewords; i++) {
    for (const b of blocksEc) interleavedBytes.push(b[i]);
  }
  // Bytes → bits
  const finalBits: Bit[] = [];
  for (const b of interleavedBytes) {
    for (let i = 7; i >= 0; i--) finalBits.push(((b >> i) & 1) as Bit);
  }

  // Build matrix
  const modules: Matrix = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  placeFunctionPatterns(size, modules, isFunction);
  placeAlignmentPatterns(version, size, modules, isFunction);
  placeData(size, modules, isFunction, finalBits);

  // Pick mask 0 (good enough; full mask scoring adds complexity we don't need here)
  const mask = 0;
  applyMask(modules, isFunction, size, mask);
  placeFormatBits(modules, size, mask);

  return modules;
}

/** Draw a QR matrix into a canvas context at (x, y) with given size. */
export function drawQR(
  ctx: CanvasRenderingContext2D,
  matrix: boolean[][],
  x: number,
  y: number,
  size: number,
  fg = "#0a0a0a",
  bg = "#ffffff",
) {
  const n = matrix.length;
  const cell = size / n;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = fg;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (matrix[row][col]) {
        ctx.fillRect(x + col * cell, y + row * cell, cell + 0.5, cell + 0.5);
      }
    }
  }
}
