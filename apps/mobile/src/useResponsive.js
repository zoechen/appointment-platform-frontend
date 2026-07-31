import { useWindowDimensions } from 'react-native'

/**
 * 統一的斷點判斷，畫面元件用這個 hook 決定要用手機版單欄、
 * 還是平板/桌面版的多欄版面。斷點值故意跟一般網頁常見的
 * tablet(768) / desktop(1024) 斷點對齊，因為同一套畫面在 Web 上
 * 也要跑得像正常的 RWD 網站。
 */
export function useResponsive() {
  const { width } = useWindowDimensions()
  return {
    width,
    isTablet: width >= 768,
    isDesktop: width >= 1024,
    columns: width >= 1024 ? 3 : width >= 768 ? 2 : 1
  }
}
