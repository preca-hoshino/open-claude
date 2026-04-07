type MacroConfig = {
  VERSION: string
  BUILD_TIME?: string
  PACKAGE_URL: string
  NATIVE_PACKAGE_URL?: string
  FEEDBACK_CHANNEL: string
  ISSUES_EXPLAINER: string
  VERSION_CHANGELOG?: string
}

declare global {
  var MACRO: MacroConfig
}

declare module '@ant/computer-use-input' {
  export type FrontmostAppInfo = {
    bundleId?: string
    appName?: string
  } | null

  export interface ComputerUseInputAPI {
    moveMouse(x: number, y: number, smooth?: boolean): Promise<void>
    mouseButton(
      button: 'left' | 'right' | 'middle',
      action: 'click' | 'press' | 'release',
      count?: number,
    ): Promise<void>
    mouseScroll(
      amount: number,
      axis: 'vertical' | 'horizontal',
    ): Promise<void>
    mouseLocation(): Promise<{ x: number; y: number }>
    typeText(text: string): Promise<void>
    key(key: string, action: 'press' | 'release'): Promise<void>
    keys(keys: string[]): Promise<void>
    getFrontmostAppInfo(): FrontmostAppInfo
  }

  export type ComputerUseInput =
    | { isSupported: false }
    | ({ isSupported: true } & ComputerUseInputAPI)
}

declare module '@ant/computer-use-swift' {
  export interface ComputerUseAPI {
    display: {
      getSize(displayId?: number): {
        displayId: number
        width: number
        height: number
        scaleFactor: number
        originX: number
        originY: number
      }
      listAll(): Array<{
        displayId: number
        width: number
        height: number
        scaleFactor: number
        originX: number
        originY: number
      }>
    }
    screenshot: {
      captureExcluding(
        allowedBundleIds: string[],
        quality: number,
        width: number,
        height: number,
        displayId?: number,
      ): Promise<{
        base64: string
        width: number
        height: number
        displayWidth: number
        displayHeight: number
        originX: number
        originY: number
        displayId?: number
      }>
      captureRegion(
        allowedBundleIds: string[],
        x: number,
        y: number,
        w: number,
        h: number,
        outW: number,
        outH: number,
        quality: number,
        displayId?: number,
      ): Promise<{ base64: string; width: number; height: number }>
    }
    apps: {
      prepareDisplay(
        allowlistBundleIds: string[],
        hostBundleId: string,
        displayId?: number,
      ): Promise<{ hidden: string[]; activated?: string }>
      previewHideSet(
        allowlistBundleIds: string[],
        displayId?: number,
      ): Promise<Array<{ bundleId: string; displayName: string }>>
      findWindowDisplays(
        bundleIds: string[],
      ): Promise<Array<{ bundleId: string; displayIds: number[] }>>
      appUnderPoint(
        x: number,
        y: number,
      ): Promise<{ bundleId: string; displayName: string } | null>
      listInstalled(): Promise<
        Array<{ bundleId: string; displayName: string; path: string }>
      >
      iconDataUrl(path: string): string | undefined
      listRunning(): Promise<Array<{ bundleId: string; displayName: string; pid?: number }>>
      open(bundleId: string): Promise<void>
      unhide(bundleIds: string[]): Promise<void>
    }
    resolvePrepareCapture(
      allowedBundleIds: string[],
      hostBundleId: string,
      quality: number,
      width: number,
      height: number,
      preferredDisplayId?: number,
      autoResolve?: boolean,
      doHide?: boolean,
    ): Promise<{
      base64: string
      width: number
      height: number
      displayWidth: number
      displayHeight: number
      originX: number
      originY: number
      displayId: number
      hidden: string[]
      activated?: string
    }>
  }
}

// Bun text loader: import X from './file.md' resolves to a string at build time
declare module '*.md' {
  const content: string
  export default content
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ink-box': any
      'ink-text': any
      'ink-link': any
      'ink-raw-ansi': any
    }
  }
}

export {}
