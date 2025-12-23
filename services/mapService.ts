import { MapCell, Position } from '../types';

const MAP_SIZE = 8;

export const generateMap = (level: number): { cells: MapCell[], startPos: Position, bossPos: Position } => {
  const cells: MapCell[] = [];
  
  // Initialize grid
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      cells.push({
        x,
        y,
        type: 'wall', // Default to wall
        isRevealed: false
      });
    }
  }

  // Simple Random Walk for dungeon generation
  let currentX = 0;
  let currentY = 0;
  const maxSteps = 30 + (level * 3); // Slightly larger dungeons
  let steps = 0;

  const startPos = { x: 0, y: 0 };
  
  // Carve path function
  const carve = (x: number, y: number, type: MapCell['type'] = 'empty') => {
    const index = y * MAP_SIZE + x;
    if (cells[index]) {
        cells[index].type = type;
    }
  };

  carve(currentX, currentY, 'start');

  let attempts = 0;
  const MAX_ATTEMPTS = 1500; 

  while (steps < maxSteps && attempts < MAX_ATTEMPTS) {
    attempts++;
    const direction = Math.floor(Math.random() * 4);
    let nextX = currentX;
    let nextY = currentY;

    if (direction === 0) nextY--; // Up
    else if (direction === 1) nextX++; // Right
    else if (direction === 2) nextY++; // Down
    else if (direction === 3) nextX--; // Left

    // Keep bounds
    nextX = Math.max(0, Math.min(MAP_SIZE - 1, nextX));
    nextY = Math.max(0, Math.min(MAP_SIZE - 1, nextY));

    currentX = nextX;
    currentY = nextY;

    if (cells[nextY * MAP_SIZE + nextX].type === 'wall') {
        // Random chance for content
        const rand = Math.random();
        let type: MapCell['type'] = 'empty';
        if (rand > 0.82) type = 'treasure'; // More treasure (18% chance on new tile)
        else if (rand > 0.70) type = 'enemy'; // Enemies (12% chance)
        else type = 'empty';

        carve(currentX, currentY, type);
        steps++;
    }
  }

  // Place Boss at the end of the walk
  const bossPos = { x: currentX, y: currentY };
  carve(currentX, currentY, 'boss');

  return { cells, startPos, bossPos };
};
