# Letter Grid - Game Concept

## Overview

A crossword-style puzzle game where players drag letters from a bank at the bottom to fill in intersecting horizontal AND vertical words on a 6x6+ grid. Like Scrabble, **letters are shared at intersections** - one letter serves both the horizontal and vertical word.

## Core Gameplay

1. **Grid Display**: 6x6 or larger grid with intersecting words (both horizontal and vertical)
2. **Letter Bank**: Shuffled letters at the bottom of the screen
3. **Shared Letters**: Words intersect and share letters at crossing points (Scrabble-style)
4. **Drag & Drop**: Letters snap automatically into cells when dropped
5. **No Hints Mode**: No feedback during play - only reveal correctness on "Check"
6. **Win Condition**: All cells correctly filled

## Visual Layout Example

```
      0   1   2   3   4   5
    ┌───┬───┬───┬───┬───┬───┐
  0 │ G │ A │ M │ E │   │   │  ← GAME (horizontal)
    ├───┼───┼───┼───┼───┼───┤
  1 │   │ P │   │   │   │   │     ↓ APPLE (vertical, shares A)
    ├───┼───┼───┼───┼───┼───┤
  2 │   │ P │   │ C │ A │ T │  ← CAT (horizontal)
    ├───┼───┼───┼───┼───┼───┤
  3 │   │ L │   │ O │   │ R │     ↓ COW (vertical, shares C)
    ├───┼───┼───┼───┼───┼───┤     ↓ TREE (vertical, shares T)
  4 │   │ E │   │ W │   │ E │
    ├───┼───┼───┼───┼───┼───┤
  5 │   │   │   │   │   │ E │
    └───┴───┴───┴───┴───┴───┘

    ════════════════════════════
         LETTER BANK
    [P] [P] [L] [E] [O] [W] [R] [E] [E]
         (drag from here)
    ════════════════════════════
```

**Key:** Pre-filled hints shown (G, A, M, E, C, A, T), player drags remaining letters.

## Letter Sharing (Scrabble-style)

- Words cross each other at shared letter positions
- Example: "APPLE" (vertical) and "GAME" (horizontal) share the letter "A" at position (0,1)
- The letter bank contains only the **unique letters needed** (no duplicates for shared positions)
- This reduces the letter count and makes puzzles more elegant

## Game Features

- Static puzzles (hardcoded for testing)
- Touch-friendly drag and drop with snap-to-cell
- No hints during gameplay - mystery until completion
- "Check Solution" button to reveal results (correct cells green, wrong cells red)
- Reset button to restart puzzle
- Completion celebration when all correct

## Interaction Flow

1. Player sees grid with some pre-filled hint letters
2. Letter bank at bottom shows available letters (shuffled)
3. Player drags a letter from bank → drops on empty cell → letter snaps in
4. Player can drag letter from cell back to bank (undo)
5. When all cells filled, player clicks "Check"
6. Result revealed: success celebration OR incorrect cells highlighted
