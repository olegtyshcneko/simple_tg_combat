<script lang="ts">
    import { onMount } from "svelte";
    import { loadTelegramWebApp } from "$lib/telegram";
    import { draggable, droppable, type DragData } from "$lib/actions/dnd";

    // Game Data Types
    type Cell = {
        row: number;
        col: number;
        letter: string | null;
        current: string | null;
        isHint: boolean;
        status?: "correct" | "wrong" | "neutral";
    };

    type Letter = {
        id: string;
        char: string;
    };

    type DragPayload = {
        char: string;
        source: "bank" | { r: number; c: number };
    };

    // Puzzle configuration
    const GRID_SIZE = 6;
    const PUZZLE_CONFIG = [
        { r: 0, c: 0, l: "G", hint: true },
        { r: 0, c: 1, l: "A", hint: true },
        { r: 0, c: 2, l: "M", hint: true },
        { r: 0, c: 3, l: "E", hint: true },
        { r: 1, c: 1, l: "P", hint: false },
        { r: 2, c: 1, l: "P", hint: false },
        { r: 2, c: 3, l: "C", hint: true },
        { r: 2, c: 4, l: "A", hint: true },
        { r: 2, c: 5, l: "T", hint: true },
        { r: 3, c: 1, l: "L", hint: false },
        { r: 3, c: 3, l: "O", hint: false },
        { r: 3, c: 5, l: "R", hint: false },
        { r: 4, c: 1, l: "E", hint: false },
        { r: 4, c: 3, l: "W", hint: false },
        { r: 4, c: 5, l: "E", hint: false },
        { r: 5, c: 5, l: "E", hint: false },
    ];

    const INITIAL_BANK = ["P", "P", "L", "E", "O", "W", "R", "E", "E"];

    let grid: Cell[][] = $state([]);
    let bank: Letter[] = $state([]);
    let gameStatus: "playing" | "won" | "lost" = $state("playing");

    onMount(async () => {
        const tg = await loadTelegramWebApp();
        if (tg) {
            tg.requestFullscreen?.();
            tg.disableVerticalSwipes?.();
            tg.ready?.();
        }

        // Initialize Grid
        const newGrid: Cell[][] = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            const row: Cell[] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                const config = PUZZLE_CONFIG.find((p) => p.r === r && p.c === c);
                row.push({
                    row: r,
                    col: c,
                    letter: config ? config.l : null,
                    current: config && config.hint ? config.l : null,
                    isHint: config ? config.hint : false,
                    status: "neutral",
                });
            }
            newGrid.push(row);
        }
        grid = newGrid;

        // Initialize Bank
        bank = INITIAL_BANK.map((char, i) => ({ id: `bank-${i}`, char }));
    });

    // Drop handlers
    function handleDropOnCell(data: DragData, r: number, c: number) {
        const payload = data.payload as DragPayload;
        const targetCell = grid[r][c];

        if (targetCell.isHint || targetCell.letter === null) return;

        // Return existing letter to bank
        if (targetCell.current) {
            bank.push({
                id: `returned-${Date.now()}`,
                char: targetCell.current,
            });
        }

        // Place new letter
        targetCell.current = payload.char;
        targetCell.status = "neutral";

        // Remove from source
        if (payload.source === "bank") {
            bank = bank.filter((l) => l.id !== data.id);
        } else {
            const sourceCell = grid[payload.source.r][payload.source.c];
            sourceCell.current = null;
            sourceCell.status = "neutral";
        }
    }

    function handleDropOnBank(data: DragData) {
        const payload = data.payload as DragPayload;

        if (payload.source !== "bank") {
            bank.push({ id: data.id, char: payload.char });
            const sourceCell = grid[payload.source.r][payload.source.c];
            sourceCell.current = null;
            sourceCell.status = "neutral";
        }
    }

    function canDropOnCell(r: number, c: number) {
        const cell = grid[r]?.[c];
        return cell && !cell.isHint && cell.letter !== null;
    }

    function checkSolution() {
        let allCorrect = true;
        let allFilled = true;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = grid[r][c];
                if (cell.letter !== null) {
                    if (cell.current === null) {
                        allFilled = false;
                        cell.status = "neutral";
                    } else if (cell.current === cell.letter) {
                        cell.status = "correct";
                    } else {
                        cell.status = "wrong";
                        allCorrect = false;
                    }
                }
            }
        }

        grid = [...grid];

        if (allCorrect && allFilled) {
            gameStatus = "won";
        } else {
            gameStatus = "playing";
        }
    }

    function resetGame() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = grid[r][c];
                if (!cell.isHint && cell.letter !== null) {
                    cell.current = null;
                    cell.status = "neutral";
                }
            }
        }
        grid = [...grid];
        bank = INITIAL_BANK.map((char, i) => ({ id: `bank-${i}`, char }));
        gameStatus = "playing";
    }
</script>

<svelte:head>
    <title>Word Game | Simple TG Combat</title>
</svelte:head>

<main class="page">
    <section class="card game-card">
        <h1>Word Puzzle</h1>

        <div class="grid-container">
            {#each grid as row, r}
                <div class="row">
                    {#each row as cell, c}
                        <div
                            class="cell"
                            class:empty={cell.letter === null}
                            class:hint={cell.isHint}
                            class:correct={cell.status === "correct"}
                            class:wrong={cell.status === "wrong"}
                            use:droppable={{
                                onDrop: (data) => handleDropOnCell(data, r, c),
                                canDrop: () => canDropOnCell(r, c),
                            }}
                        >
                            {#if cell.current}
                                <div
                                    class="tile"
                                    class:draggable={!cell.isHint}
                                    use:draggable={{
                                        data: () => ({
                                            id: `cell-${r}-${c}`,
                                            payload: { char: cell.current!, source: { r, c } },
                                        }),
                                        disabled: cell.isHint,
                                    }}
                                >
                                    {cell.current}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/each}
        </div>

        <div
            class="bank-container"
            use:droppable={{ onDrop: handleDropOnBank }}
        >
            <p class="muted">Drag letters to the grid</p>
            <div class="bank">
                {#each bank as letter (letter.id)}
                    <div
                        class="tile bank-tile"
                        use:draggable={{
                            data: () => ({
                                id: letter.id,
                                payload: { char: letter.char, source: "bank" as const },
                            }),
                        }}
                    >
                        {letter.char}
                    </div>
                {/each}
            </div>
        </div>

        <div class="controls">
            <button class="btn-primary" onclick={checkSolution}>Check Solution</button>
            <button class="btn-secondary" onclick={resetGame}>Reset</button>
        </div>

        {#if gameStatus === "won"}
            <div class="victory-message">
                <h2>Puzzle Solved!</h2>
            </div>
        {/if}
    </section>
</main>

<style>
    .page {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: none;
        padding-top: calc(1rem + var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px));
        padding-bottom: calc(1rem + var(--tg-content-safe-area-inset-bottom, 0px) + var(--tg-safe-area-inset-bottom, 0px));
        padding-left: calc(1rem + var(--tg-safe-area-inset-left, 0px));
        padding-right: calc(1rem + var(--tg-safe-area-inset-right, 0px));
        box-sizing: border-box;
        background: radial-gradient(circle at 10% 20%, #1b2a33, #0c1014 35%),
            #050607;
        color: var(--color-text-primary);
        align-items: center;
    }

    .game-card {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: 18px;
        padding: 1.5rem;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 22px 50px rgba(0, 0, 0, 0.4);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
        text-align: center;
    }

    .grid-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: rgba(0, 0, 0, 0.2);
        padding: 8px;
        border-radius: 8px;
    }

    .row {
        display: flex;
        gap: 4px;
    }

    .cell {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .cell.empty {
        background: transparent;
        border: none;
    }

    .cell.hint {
        background: rgba(255, 255, 255, 0.1);
    }

    .cell.correct {
        background: rgba(46, 204, 113, 0.2);
        border-color: #2ecc71;
    }

    .cell.wrong {
        background: rgba(231, 76, 60, 0.2);
        border-color: #e74c3c;
    }

    .tile {
        width: 36px;
        height: 36px;
        background: #e8f1f5;
        color: #050607;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.2rem;
        cursor: grab;
        user-select: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .tile:active {
        cursor: grabbing;
    }

    .tile.draggable {
        background: #7dd0ff;
    }

    :global(.ghost-tile) {
        width: 36px;
        height: 36px;
        background: #7dd0ff;
        color: #050607;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        opacity: 0.9;
    }

    .bank-container {
        width: 100%;
        min-height: 80px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .bank {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
    }

    .bank-tile {
        background: #7dd0ff;
    }

    .muted {
        margin: 0;
        font-size: 0.9rem;
        color: var(--color-text-muted);
    }

    .controls {
        display: flex;
        gap: 1rem;
        width: 100%;
    }

    button {
        flex: 1;
        padding: 0.8rem;
        border-radius: 12px;
        border: none;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition:
            transform 0.1s,
            opacity 0.2s;
    }

    button:active {
        transform: scale(0.98);
    }

    .btn-primary {
        background: var(--color-accent);
        color: #050607;
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: var(--color-text-primary);
    }

    .victory-message {
        color: #2ecc71;
        text-align: center;
        animation: bounce 0.5s infinite alternate;
    }

    @keyframes bounce {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(-5px);
        }
    }
</style>
