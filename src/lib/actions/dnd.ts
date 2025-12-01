/**
 * Drag and Drop Actions for Svelte 5
 * Supports both desktop (HTML5 DnD) and mobile (touch events)
 */

export type DragData = {
    id: string;
    payload: unknown;
};

type DraggableOptions<T = unknown> = {
    data: () => { id: string; payload: T };
    disabled?: boolean;
    onDragStart?: (data: DragData) => void;
    onDragEnd?: () => void;
};

type DroppableOptions<T = unknown> = {
    onDrop: (data: DragData) => void;
    canDrop?: (data: DragData) => boolean;
    onDragOver?: (data: DragData) => void;
    onDragLeave?: () => void;
};

// Shared drag state
let currentDrag: DragData | null = null;
let ghostElement: HTMLDivElement | null = null;
let currentHoverTarget: Element | null = null;
let draggingNode: HTMLElement | null = null; // Track which node is being dragged

// Ghost offset: position above and slightly right of finger for visibility
const GHOST_OFFSET_X = 10;
const GHOST_OFFSET_Y = -60;

function createGhost(text: string, x: number, y: number): HTMLDivElement {
    const ghost = document.createElement("div");
    ghost.className = "ghost-tile";
    ghost.textContent = text;
    ghost.style.cssText = `
        position: fixed;
        left: ${x + GHOST_OFFSET_X}px;
        top: ${y + GHOST_OFFSET_Y}px;
        pointer-events: none;
        z-index: 1000;
    `;
    document.body.appendChild(ghost);
    return ghost;
}

function moveGhost(x: number, y: number) {
    if (ghostElement) {
        ghostElement.style.left = `${x + GHOST_OFFSET_X}px`;
        ghostElement.style.top = `${y + GHOST_OFFSET_Y}px`;
    }
}

function removeGhost() {
    if (ghostElement) {
        ghostElement.remove();
        ghostElement = null;
    }
}

function findDropTarget(x: number, y: number): Element | null {
    if (ghostElement) ghostElement.style.display = "none";
    const target = document.elementFromPoint(x, y);
    if (ghostElement) ghostElement.style.display = "";
    return target;
}

function updateHoverTarget(x: number, y: number) {
    const target = findDropTarget(x, y);
    const droppable = target?.closest("[data-droppable]");

    if (droppable !== currentHoverTarget) {
        if (currentHoverTarget) {
            currentHoverTarget.dispatchEvent(new CustomEvent("dnd:leave"));
        }
        if (droppable && currentDrag) {
            droppable.dispatchEvent(
                new CustomEvent("dnd:over", { detail: currentDrag }),
            );
        }
        currentHoverTarget = droppable || null;
    }
}

function cleanupDrag() {
    if (currentHoverTarget) {
        currentHoverTarget.dispatchEvent(new CustomEvent("dnd:leave"));
        currentHoverTarget = null;
    }
    removeGhost();
    if (draggingNode) {
        draggingNode.removeAttribute("data-dragging");
        draggingNode = null;
    }
    currentDrag = null;
}

/**
 * Makes an element draggable (supports both mouse and touch)
 */
export function draggable<T>(node: HTMLElement, options: DraggableOptions<T>) {
    let currentOptions = options;

    function handleDragStart(e: DragEvent) {
        if (currentOptions.disabled) return;

        const data = currentOptions.data();
        currentDrag = { id: data.id, payload: data.payload };
        draggingNode = node;
        node.setAttribute("data-dragging", "true");

        if (e.dataTransfer) {
            e.dataTransfer.setData("text/plain", JSON.stringify(currentDrag));
            e.dataTransfer.effectAllowed = "move";
        }

        currentOptions.onDragStart?.(currentDrag);
    }

    function handleDragEnd() {
        // Only process if this is the dragging node
        if (draggingNode !== node) return;

        cleanupDrag();
        currentOptions.onDragEnd?.();
    }

    function handleTouchStart(e: TouchEvent) {
        if (currentOptions.disabled) return;

        // If another drag is in progress, ignore
        if (currentDrag) return;

        e.preventDefault();

        const data = currentOptions.data();
        currentDrag = { id: data.id, payload: data.payload };
        draggingNode = node;
        node.setAttribute("data-dragging", "true");

        const touch = e.touches[0];
        ghostElement = createGhost(
            node.textContent || "",
            touch.clientX,
            touch.clientY,
        );

        currentOptions.onDragStart?.(currentDrag);
    }

    function handleTouchMove(e: TouchEvent) {
        // Only the dragging node should handle move
        if (draggingNode !== node || !currentDrag) return;
        e.preventDefault();

        const touch = e.touches[0];
        moveGhost(touch.clientX, touch.clientY);
        updateHoverTarget(touch.clientX, touch.clientY);
    }

    function handleTouchEnd(e: TouchEvent) {
        // Only the dragging node should handle end
        if (draggingNode !== node || !currentDrag) return;

        const touch = e.changedTouches[0];
        const dropTarget = findDropTarget(touch.clientX, touch.clientY);

        if (dropTarget) {
            const droppable = dropTarget.closest("[data-droppable]");
            if (droppable) {
                droppable.dispatchEvent(
                    new CustomEvent("dnd:drop", {
                        detail: currentDrag,
                        bubbles: false,
                    }),
                );
            }
        }

        cleanupDrag();
        currentOptions.onDragEnd?.();
    }

    // Set up listeners
    node.setAttribute("draggable", currentOptions.disabled ? "false" : "true");
    node.style.touchAction = "none";

    node.addEventListener("dragstart", handleDragStart);
    node.addEventListener("dragend", handleDragEnd);
    node.addEventListener("touchstart", handleTouchStart, { passive: false });

    // Global touch listeners
    const Doc = node.ownerDocument;
    Doc.addEventListener("touchmove", handleTouchMove, { passive: false });
    Doc.addEventListener("touchend", handleTouchEnd);
    Doc.addEventListener("touchcancel", handleTouchEnd);

    return {
        update(newOptions: DraggableOptions<T>) {
            currentOptions = newOptions;
            node.setAttribute(
                "draggable",
                newOptions.disabled ? "false" : "true",
            );
        },
        destroy() {
            node.removeEventListener("dragstart", handleDragStart);
            node.removeEventListener("dragend", handleDragEnd);
            node.removeEventListener("touchstart", handleTouchStart);
            Doc.removeEventListener("touchmove", handleTouchMove);
            Doc.removeEventListener("touchend", handleTouchEnd);
            Doc.removeEventListener("touchcancel", handleTouchEnd);

            // Clean up if this node was being dragged when destroyed
            if (draggingNode === node) {
                cleanupDrag();
            }
        },
    };
}

/**
 * Makes an element a drop target
 */
export function droppable<T>(node: HTMLElement, options: DroppableOptions<T>) {
    let currentOptions = options;

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "move";
        }
        if (currentDrag) {
            node.setAttribute("data-drag-over", "true");
            currentOptions.onDragOver?.(currentDrag);
        }
    }

    function handleDragLeave() {
        node.removeAttribute("data-drag-over");
        currentOptions.onDragLeave?.();
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        node.removeAttribute("data-drag-over");
        if (!currentDrag) return;

        if (!currentOptions.canDrop || currentOptions.canDrop(currentDrag)) {
            currentOptions.onDrop(currentDrag);
        }
    }

    function handleTouchOver(e: CustomEvent<DragData>) {
        node.setAttribute("data-drag-over", "true");
        currentOptions.onDragOver?.(e.detail);
    }

    function handleTouchLeave() {
        node.removeAttribute("data-drag-over");
        currentOptions.onDragLeave?.();
    }

    function handleTouchDrop(e: CustomEvent<DragData>) {
        node.removeAttribute("data-drag-over");
        const data = e.detail;
        if (!currentOptions.canDrop || currentOptions.canDrop(data)) {
            currentOptions.onDrop(data);
        }
    }

    node.setAttribute("data-droppable", "true");

    node.addEventListener("dragover", handleDragOver);
    node.addEventListener("dragleave", handleDragLeave);
    node.addEventListener("drop", handleDrop);
    node.addEventListener("dnd:over", handleTouchOver as EventListener);
    node.addEventListener("dnd:leave", handleTouchLeave);
    node.addEventListener("dnd:drop", handleTouchDrop as EventListener);

    return {
        update(newOptions: DroppableOptions<T>) {
            currentOptions = newOptions;
        },
        destroy() {
            node.removeAttribute("data-droppable");
            node.removeAttribute("data-drag-over");
            node.removeEventListener("dragover", handleDragOver);
            node.removeEventListener("dragleave", handleDragLeave);
            node.removeEventListener("drop", handleDrop);
            node.removeEventListener(
                "dnd:over",
                handleTouchOver as EventListener,
            );
            node.removeEventListener("dnd:leave", handleTouchLeave);
            node.removeEventListener(
                "dnd:drop",
                handleTouchDrop as EventListener,
            );
        },
    };
}

/** Get current drag data */
export function getCurrentDrag(): DragData | null {
    return currentDrag;
}
