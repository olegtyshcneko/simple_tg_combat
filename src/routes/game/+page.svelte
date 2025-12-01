<script lang="ts">
    import { onMount, onDestroy } from "svelte";
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
    let showResizeHint: boolean = $state(false);
    let isDesktop: boolean = $state(false);

    // Max game container needs ~340px width (6 cells * ~44px + gaps + padding) and ~520px height
    const MIN_COMFORTABLE_WIDTH = 380;
    const MIN_COMFORTABLE_HEIGHT = 520;

    function checkViewportSize() {
        if (!isDesktop) return;
        const isComfortable = window.innerWidth >= MIN_COMFORTABLE_WIDTH &&
                              window.innerHeight >= MIN_COMFORTABLE_HEIGHT;
        showResizeHint = !isComfortable;
    }

    onMount(async () => {
        const tg = await loadTelegramWebApp();
        const isMobile = tg?.platform === "ios" || tg?.platform === "android";

        // Consider desktop if: explicitly desktop/web, OR platform unknown and not mobile
        isDesktop = tg?.platform === "web" || tg?.platform === "desktop" || (!isMobile && !tg?.platform);

        if (tg) {
            if (isMobile) {
                tg.requestFullscreen?.();
            }
            tg.expand?.();
            tg.disableVerticalSwipes?.();
            tg.ready?.();
        }

        // Check initial size and listen for resize on desktop/web
        if (isDesktop) {
            checkViewportSize();
            window.addEventListener("resize", checkViewportSize);
        }

        // Initialize Grid
        const newGrid: Cell[][] = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            const row: Cell[] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                const config = PUZZLE_CONFIG.find(
                    (p) => p.r === r && p.c === c,
                );
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

    onDestroy(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("resize", checkViewportSize);
        }
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
    {#if showResizeHint}
        <p class="resize-hint">Resize window for better experience</p>
    {/if}
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
                                            payload: {
                                                char: cell.current!,
                                                source: { r, c },
                                            },
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
                                payload: {
                                    char: letter.char,
                                    source: "bank" as const,
                                },
                            }),
                        }}
                    >
                        {letter.char}
                    </div>
                {/each}
            </div>
        </div>

        <div class="controls">
            <button class="btn-primary" onclick={checkSolution}
                >Check Solution</button
            >
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
        height: var(--tg-viewport-stable-height, 100vh);
        min-height: var(--tg-viewport-stable-height, 100vh);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: none;
        padding: calc(0.5rem + var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px))
                 calc(0.5rem + var(--tg-safe-area-inset-right, 0px))
                 calc(0.5rem + var(--tg-content-safe-area-inset-bottom, 0px) + var(--tg-safe-area-inset-bottom, 0px))
                 calc(0.5rem + var(--tg-safe-area-inset-left, 0px));
        box-sizing: border-box;
        background:
            radial-gradient(circle at 10% 20%, #1b2a33, #0c1014 35%), #050607;
        color: var(--color-text-primary);
        align-items: center;
        justify-content: center;
    }

    .game-card {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 0.75rem;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 22px 50px rgba(0, 0, 0, 0.4);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    h1 {
        margin: 0;
        font-size: 1.1rem;
        text-align: center;
    }

    .grid-container {
        display: flex;
        flex-direction: column;
        gap: 3px;
        background: rgba(0, 0, 0, 0.2);
        padding: 6px;
        border-radius: 6px;
    }

    .row {
        display: flex;
        gap: 3px;
    }

    .cell {
        width: clamp(32px, 8vw, 44px);
        height: clamp(32px, 8vw, 44px);
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

    /* Highlight valid drop target on hover */
    .cell:global([data-drag-over]) {
        background: rgba(125, 208, 255, 0.3);
        border-color: #7dd0ff;
        box-shadow: 0 0 8px rgba(125, 208, 255, 0.5);
    }

    .tile {
        width: clamp(28px, 7vw, 40px);
        height: clamp(28px, 7vw, 40px);
        background: #e8f1f5;
        color: #050607;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: clamp(0.9rem, 3vw, 1.2rem);
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

    /* Hide source tile while dragging */
    .tile:global([data-dragging]) {
        opacity: 0.3;
    }

    :global(.ghost-tile) {
        width: 44px;
        height: 44px;
        background: #7dd0ff;
        color: #050607;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.3rem;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
        opacity: 0.95;
    }

    .bank-container {
        width: 100%;
        min-height: 60px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
    }

    .bank {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
    }

    .bank-tile {
        background: #7dd0ff;
    }

    .muted {
        margin: 0;
        font-size: 0.75rem;
        color: var(--color-text-muted);
    }

    .controls {
        display: flex;
        gap: 0.5rem;
        width: 100%;
    }

    button {
        flex: 1;
        padding: 0.6rem;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        font-size: 0.85rem;
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

    .victory-message h2 {
        font-size: 1.1rem;
        margin: 0;
    }

    .resize-hint {
        margin: 0 0 0.5rem 0;
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
        color: var(--color-text-muted);
        background: rgba(125, 208, 255, 0.15);
        border: 1px solid rgba(125, 208, 255, 0.3);
        border-radius: 6px;
        text-align: center;
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
    }

    @keyframes bounce {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(-3px);
        }
    }

    /* Larger screens - restore bigger sizes */
    @media (min-width: 400px) and (min-height: 600px) {
        .page {
            padding: calc(1rem + var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px))
                     calc(1rem + var(--tg-safe-area-inset-right, 0px))
                     calc(1rem + var(--tg-content-safe-area-inset-bottom, 0px) + var(--tg-safe-area-inset-bottom, 0px))
                     calc(1rem + var(--tg-safe-area-inset-left, 0px));
        }

        .game-card {
            padding: 1.25rem;
            gap: 1.25rem;
            border-radius: 18px;
        }

        h1 {
            font-size: 1.5rem;
        }

        .grid-container {
            gap: 4px;
            padding: 8px;
        }

        .row {
            gap: 4px;
        }

        .bank-container {
            min-height: 80px;
            padding: 1rem;
            gap: 0.5rem;
        }

        .bank {
            gap: 8px;
        }

        .muted {
            font-size: 0.9rem;
        }

        .controls {
            gap: 1rem;
        }

        button {
            padding: 0.8rem;
            font-size: 1rem;
            border-radius: 12px;
        }

        .victory-message h2 {
            font-size: 1.5rem;
        }
    }
</style>
