/// <reference types="wicg-file-system-access" />

declare const THREE: typeof import('three')
// todo make optional
declare const bot: Omit<import('mineflayer').Bot, 'world'> & { world: import('prismarine-world').world.WorldSync }
declare const __type_bot: typeof bot
declare const viewer: import('prismarine-viewer/viewer/lib/viewer').Viewer | undefined
declare const worldView: import('prismarine-viewer/viewer/lib/worldDataEmitter').WorldDataEmitter | undefined
declare const localServer: any

declare interface Document {
    getElementById (id): any
    exitPointerLock?(): void
}

declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any
    }
}

declare interface DocumentFragment {
    getElementById (id): HTMLElement & Record<string, any>
    querySelector (id): HTMLElement & Record<string, any>
}

declare interface Window extends Record<string, any> {

}

type StringKeys<T extends object> = Extract<keyof T, string>


interface ObjectConstructor {
    keys<T extends object> (obj: T): Array<StringKeys<T>>
    entries<T extends object> (obj: T): Array<[StringKeys<T>, T[keyof T]]>
    // todo review https://stackoverflow.com/questions/57390305/trying-to-get-fromentries-type-right
    fromEntries<T extends Array<[string, any]>> (obj: T): Record<T[number][0], T[number][1]>
    assign<T extends Record<string, any>, K extends Record<string, any>> (target: T, source: K): asserts target is T & K
}

declare module '*.module.css' {
    const css: Record<string, string>
    export default css
}
declare module '*.css' {
    const css: string
    export default css
}
declare module '*.png' {
    const png: string
    export default png
}
