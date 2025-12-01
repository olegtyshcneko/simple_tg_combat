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

function createGhost(text: string, x: number, y: number): HTMLDivElement {
    const ghost = document.createElement("div");
    ghost.className = "ghost-tile";
    ghost.textContent = text;
    ghost.style.cssText = `
        position: fixed;
        left: ${x - 18}px;
        top: ${y - 18}px;
        pointer-events: none;
        z-index: 1000;
    `;
    document.body.appendChild(ghost);
    return ghost;
}

function moveGhost(x: number, y: number) {
    if (ghostElement) {
        ghostElement.style.left = `${x - 18}px`;
        ghostElement.style.top = `${y - 18}px`;
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

/**
 * Makes an element draggable (supports both mouse and touch)
 */
export function draggable<T>(node: HTMLElement, options: DraggableOptions<T>) {
    let currentOptions = options;

    function handleDragStart(e: DragEvent) {
        if (currentOptions.disabled) return;

        const data = currentOptions.data();
        currentDrag = { id: data.id, payload: data.payload };

        if (e.dataTransfer) {
            e.dataTransfer.setData("text/plain", JSON.stringify(currentDrag));
            e.dataTransfer.effectAllowed = "move";
        }

        currentOptions.onDragStart?.(currentDrag);
    }

    function handleDragEnd() {
        currentDrag = null;
        currentOptions.onDragEnd?.();
    }

    function handleTouchStart(e: TouchEvent) {
        if (currentOptions.disabled) return;
        e.preventDefault();

        const data = currentOptions.data();
        currentDrag = { id: data.id, payload: data.payload };

        const touch = e.touches[0];
        ghostElement = createGhost(
            node.textContent || "",
            touch.clientX,
            touch.clientY
        );

        currentOptions.onDragStart?.(currentDrag);
    }

    function handleTouchMove(e: TouchEvent) {
        if (!currentDrag) return;
        e.preventDefault();

        const touch = e.touches[0];
        moveGhost(touch.clientX, touch.clientY);
    }

    function handleTouchEnd(e: TouchEvent) {
        if (!currentDrag) return;

        const touch = e.changedTouches[0];
        const dropTarget = findDropTarget(touch.clientX, touch.clientY);

        if (dropTarget) {
            // Find the droppable element and trigger its handler
            const droppable = dropTarget.closest("[data-droppable]");
            if (droppable) {
                const event = new CustomEvent("dnd:drop", {
                    detail: currentDrag,
                    bubbles: false,
                });
                droppable.dispatchEvent(event);
            }
        }

        removeGhost();
        currentOptions.onDragEnd?.();
        currentDrag = null;
    }

    // Set up listeners
    node.setAttribute("draggable", currentOptions.disabled ? "false" : "true");
    node.style.touchAction = "none";

    node.addEventListener("dragstart", handleDragStart);
    node.addEventListener("dragend", handleDragEnd);
    node.addEventListener("touchstart", handleTouchStart, { passive: false });

    // Global touch listeners (attached to window to track movement outside element)
    const Doc = node.ownerDocument;
    Doc.addEventListener("touchmove", handleTouchMove, { passive: false });
    Doc.addEventListener("touchend", handleTouchEnd);
    Doc.addEventListener("touchcancel", handleTouchEnd);

    return {
        update(newOptions: DraggableOptions<T>) {
            currentOptions = newOptions;
            node.setAttribute("draggable", newOptions.disabled ? "false" : "true");
        },
        destroy() {
            node.removeEventListener("dragstart", handleDragStart);
            node.removeEventListener("dragend", handleDragEnd);
            node.removeEventListener("touchstart", handleTouchStart);
            Doc.removeEventListener("touchmove", handleTouchMove);
            Doc.removeEventListener("touchend", handleTouchEnd);
            Doc.removeEventListener("touchcancel", handleTouchEnd);
            removeGhost();
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
            currentOptions.onDragOver?.(currentDrag);
        }
    }

    function handleDragLeave() {
        currentOptions.onDragLeave?.();
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        if (!currentDrag) return;

        if (!currentOptions.canDrop || currentOptions.canDrop(currentDrag)) {
            currentOptions.onDrop(currentDrag);
        }
    }

    function handleTouchDrop(e: CustomEvent<DragData>) {
        const data = e.detail;
        if (!currentOptions.canDrop || currentOptions.canDrop(data)) {
            currentOptions.onDrop(data);
        }
    }

    // Mark as droppable for touch detection
    node.setAttribute("data-droppable", "true");

    node.addEventListener("dragover", handleDragOver);
    node.addEventListener("dragleave", handleDragLeave);
    node.addEventListener("drop", handleDrop);
    node.addEventListener("dnd:drop", handleTouchDrop as EventListener);

    return {
        update(newOptions: DroppableOptions<T>) {
            currentOptions = newOptions;
        },
        destroy() {
            node.removeAttribute("data-droppable");
            node.removeEventListener("dragover", handleDragOver);
            node.removeEventListener("dragleave", handleDragLeave);
            node.removeEventListener("drop", handleDrop);
            node.removeEventListener("dnd:drop", handleTouchDrop as EventListener);
        },
    };
}

/** Get current drag data (useful for checking drag state) */
export function getCurrentDrag(): DragData | null {
    return currentDrag;
}
