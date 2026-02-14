import type * as React from "react"

export function composeRefs<T>(
    ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
    return (node) => {
        for (const ref of refs) {
            if (typeof ref === "function") ref(node)
            else if (ref != null)
                (ref as React.MutableRefObject<T | null>).current = node
        }
    }
}
