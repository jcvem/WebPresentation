// Internationalization (i18n) Engine — English & Traditional Chinese (繁體中文)
import { SlideData } from '../slides/slide-data';

export type Language = 'en' | 'zh-TW';

export const SLIDES_ZH_TW: SlideData[] = [
  {
    id: "opening",
    index: 0,
    catalogNumber: "圖版 01 / 06",
    superTitle: "展覽專題論集 · 第四卷",
    title: "動態物件",
    thesis: "連續動態幾何、機械層級結構與空間器物演進之專題研究。",
    metadata: [
      { label: "創作媒材", value: "程序化 WEBGL" },
      { label: "基準結構", value: "三軸萬向環" },
      { label: "質量比例", value: "1 : 1.618" }
    ],
    pose: {
      rotX: 0.22,
      rotY: 0.45,
      rotZ: 0.08,
      spinRate: 0.005,
      gimbalPitch: 0.15,
      coreSplit: 0.0,
      explodedDistance: 0.0,
      dialAlign: 0.0,
      scale: 1.05
    }
  },
  {
    id: "form",
    index: 1,
    catalogNumber: "圖版 02 / 06",
    superTitle: "結構解剖學",
    title: "內部幾何結構",
    thesis: "同心環在三維正交平面上分配徑向平衡。",
    body: "在動態釋放之前，穩定性透過巢狀同心外層得以維持。外層鈦金屬邊框庇護著鉸接萬向底盤，緊密包覆精密琢面的八面體核心。",
    metadata: [
      { label: "對稱性", value: "D4h 八面體對稱" },
      { label: "容差範圍", value: "±0.04 毫米" },
      { label: "平衡模式", value: "慣性阻尼" }
    ],
    pose: {
      rotX: 0.48,
      rotY: -0.32,
      rotZ: 0.25,
      spinRate: 0.003,
      gimbalPitch: 0.65,
      coreSplit: 0.08,
      explodedDistance: 0.15,
      dialAlign: 0.0,
      scale: 1.15
    }
  },
  {
    id: "motion",
    index: 2,
    catalogNumber: "圖版 03 / 06",
    superTitle: "動態演進序列",
    title: "相位解耦",
    thesis: "旋轉動量以協同的三階段循環序列將外層機架與核心分離。",
    sequence: [
      {
        index: "01",
        title: "軸向釋放",
        detail: "赤道鎖定裝置解除；外層機架開始穩定進動。"
      },
      {
        index: "02",
        title: "雙軸進動",
        detail: "次級萬向環產生異相傾斜以吸收角動量。"
      },
      {
        index: "03",
        title: "陀螺儀鎖定",
        detail: "多面稜鏡核心在周圍環體軌道運行時維持其垂直向量穩定。"
      }
    ],
    metadata: [
      { label: "相位偏移", value: "90° 反向軸" },
      { label: "角動量", value: "守恆狀態" }
    ],
    pose: {
      rotX: -0.35,
      rotY: 1.15,
      rotZ: -0.42,
      spinRate: 0.012,
      gimbalPitch: 1.25,
      coreSplit: 0.18,
      explodedDistance: 0.35,
      dialAlign: 0.0,
      scale: 1.1
    }
  },
  {
    id: "system",
    index: 3,
    catalogNumber: "圖版 04 / 06",
    superTitle: "爆炸拓撲結構",
    title: "組成結構總成",
    thesis: "解構為主要子系統後，每個元件皆各司其單一機械職能。",
    components: [
      {
        tag: "A",
        name: "慣性外環邊框",
        description: "具備徑向刻度的精密外環；抵消外部阻力並維持角慣性。",
        coords: { x: 0.28, y: 0.26 }
      },
      {
        tag: "B",
        name: "雙軸萬向支架",
        description: "雙樞軸懸吊連動座，實現無摩擦角向偏轉與動態靈活性。",
        coords: { x: 0.72, y: 0.44 }
      },
      {
        tag: "C",
        name: "多面核心稜鏡",
        description: "八面體基準稜鏡，作為整個系統的主要空間幾何原點。",
        coords: { x: 0.32, y: 0.76 }
      }
    ],
    metadata: [
      { label: "組裝規模", value: "3 個主要組件 / 8 個附屬件" },
      { label: "位移狀態", value: "徑向展開拓撲" }
    ],
    pose: {
      rotX: 0.38,
      rotY: 0.72,
      rotZ: 0.12,
      spinRate: 0.002,
      gimbalPitch: 0.85,
      coreSplit: 0.42,
      explodedDistance: 0.85,
      dialAlign: 0.0,
      scale: 1.25
    }
  },
  {
    id: "application",
    index: 4,
    catalogNumber: "圖版 05 / 06",
    superTitle: "功能綜合體",
    title: "天體觀測儀器",
    thesis: "當進入共面校準時，各獨立部件化為極其精密的座標傳感器。",
    takeaway: "器物由雕塑形體轉化為光學刻度盤。十字準線十字絲與精密校正凹口在變換的地平線間提供精準視線觀測。",
    metadata: [
      { label: "解析模式", value: "渾天儀地平坐標" },
      { label: "精準度", value: "±0.02° 游標尺" },
      { label: "操作介面", value: "光學瞄準校準" }
    ],
    pose: {
      rotX: 0.15,
      rotY: 0.0,
      rotZ: 0.0,
      spinRate: 0.001,
      gimbalPitch: 0.0,
      coreSplit: 0.0,
      explodedDistance: 0.05,
      dialAlign: 1.0,
      scale: 1.2
    }
  },
  {
    id: "closing",
    index: 5,
    catalogNumber: "圖版 06 / 06",
    superTitle: "平衡歸一",
    title: "靜止形態",
    thesis: "動態終結於幾何起始之處：器物重新聚合回其整塊沉靜之姿。",
    takeaway: "網頁簡報無需仿造傳統實體紙質幻燈片。將瀏覽視窗視為沉浸式展覽舞台，內容與三維空間物件將在持續互動中共同演繹。",
    metadata: [
      { label: "系統狀態", value: "平衡歸位完成" },
      { label: "總圖版數", value: "全 6 版" }
    ],
    action: {
      primaryText: "重新播放簡報",
      secondaryText: "切換自由滾動"
    },
    pose: {
      rotX: 0.28,
      rotY: -0.45,
      rotZ: 0.12,
      spinRate: 0.003,
      gimbalPitch: 0.18,
      coreSplit: 0.0,
      explodedDistance: 0.0,
      dialAlign: 0.0,
      scale: 1.08
    }
  }
];

export const UI_TRANSLATIONS: Record<Language, Record<string, string>> = {
  'en': {
    brandName: 'SUBJECTS IN MOTION',
    brandSub: 'by / VEM Studio',
    fontsBtn: 'FONTS',
    colorsBtn: 'COLORS',
    controlBtn: 'CONTROL',
    langToggle: '繁中',
    langToggleTitle: 'Switch to Traditional Chinese / 切換至繁體中文',
    
    // Header Indicators
    openingSlideTitle: 'OPENING',
    prevSlideTitle: 'Previous slide (ArrowUp / PageUp)',
    nextSlideTitle: 'Next slide (ArrowDown / PageDown)',
    skipToMain: 'Skip to main presentation',
    
    // Control Popover
    menuGroupDesign: 'DESIGN & AUTHORING',
    menuStudioTitle: 'STUDIO MAKER',
    menuStudioHint: 'Presentation Editor',
    menuFontsTitle: 'FONTS PALETTE',
    menuFontsHint: 'Google Fonts',
    menuThemeTitle: 'COLOR THEMES',
    menuThemeHint: 'Obsidian, Cobalt...',
    menuGroupNav: 'NAVIGATION & MOTION',
    menuSnapOn: 'SNAP: ON',
    menuSnapOff: 'SNAP: OFF',
    menuSnapHint: 'Page Snapping',
    menuMotionFluid: 'MOTION: FLUID',
    menuMotionReduced: 'MOTION: REDUCED',
    menuMotionHint: 'WebGL Kinetic',
    menuGroupRecording: 'RECORDING',
    menuRecordTitle: 'Record presentation',
    menuSlidePace: 'Slide Pace:',
    menuPaceDefault: '3.5s (Default)',
    menuPacePaced: '5.0s (Paced)',
    menuPaceFast: '2.0s (Fast)',
    menuGroupShortcuts: 'KEYBOARD SHORTCUTS',
    
    // Dialogs
    shortcutsHeading: 'KEYBOARD SHORTCUTS',
    shortcutNext: 'Next slide',
    shortcutPrev: 'Previous slide',
    shortcutRestart: 'Restart presentation',
    shortcutMotion: 'Toggle reduced motion',
    dialogEscClose: 'Press Esc to close.',
    
    // Font Modal
    fontModalBadge: 'GOOGLE FONTS ENGINE',
    fontModalHeading: 'TYPOGRAPHY & WEIGHT PALETTE',
    fontModalSub: 'Select curated editorial font pairings or specify custom Google Fonts and typography weights (Thin to Black).',
    tabCuratedPairings: 'CURATED PAIRINGS',
    tabCustomFonts: 'CUSTOM GOOGLE FONTS & WEIGHTS',
    labelDisplayFont: 'DISPLAY / TITLE FONT',
    labelBodyFont: 'BODY / PARAGRAPH FONT',
    labelDisplayWeight: 'TITLE WEIGHT',
    labelBodyWeight: 'BODY WEIGHT',
    btnApplyTypography: 'Apply Custom Typography',
    btnResetTypography: 'Reset Default Typography',
    
    // Theme Modal
    themeModalBadge: 'COLOR CHROMATICS ENGINE',
    themeModalHeading: 'COLOR THEMES & CHROMATIC PALETTES',
    themeModalSub: 'Select curated exhibition color identities (including Obsidian/Cadmium and Ceramic/Cobalt) or configure custom palette aesthetics.',
    tabCuratedThemes: 'CURATED THEMES',
    tabCustomTheme: 'CUSTOM PALETTE BUILDER',
    labelBgMode: 'BACKGROUND MODE',
    modeDark: 'Dark (Titanium / Obsidian Substrate)',
    modeLight: 'Light (Ceramic / Architectural Alabaster)',
    labelAccentColor: 'ACCENT CHROMATIC COLOR',
    quickSwatchesLabel: 'QUICK ACCENT SWATCHES',
    btnApplyTheme: 'Apply Custom Palette',
    btnResetTheme: 'Reset to Monograph Default',
    
    // Studio
    studioBadge: 'AUTHORING STUDIO',
    studioHeading: 'PRESENTATION STUDIO',
    tabSlideContent: 'SLIDE CONTENT',
    tabObjectPose: '3D OBJECT POSE',
    tabImportExport: 'EXPORT / IMPORT',
    labelSuperTitle: 'Super-title / Section Tag',
    labelSlideTitle: 'Slide Title',
    labelThesis: 'Thesis Statement',
    labelBody: 'Narrative Body',
    label3DModel: '3D Subject Geometry',
    btnApplyPreset: 'Apply Preset',
    btnExportJSON: 'Export Slide Deck JSON',
    btnImportJSON: 'Import Deck JSON',
    btnResetDefault: 'Reset to Default Template'
  },
  'zh-TW': {
    brandName: '動態物件',
    brandSub: '由 / VEM 工作室',
    fontsBtn: '字型',
    colorsBtn: '色彩',
    controlBtn: '控制',
    langToggle: 'EN',
    langToggleTitle: 'Switch to English / 切換至英文',
    
    // Header Indicators
    openingSlideTitle: '序章',
    prevSlideTitle: '上一頁 (方向鍵上 / ArrowUp)',
    nextSlideTitle: '下一頁 (方向鍵下 / ArrowDown)',
    skipToMain: '跳至主要簡報內容',
    
    // Control Popover
    menuGroupDesign: '設計與創作',
    menuStudioTitle: '工坊編輯器',
    menuStudioHint: '簡報即時編輯',
    menuFontsTitle: '字型調色盤',
    menuFontsHint: 'Google 字型系統',
    menuThemeTitle: '色彩主題',
    menuThemeHint: '黑曜石、鈷藍...',
    menuGroupNav: '導航與動態',
    menuSnapOn: '對齊：開啟',
    menuSnapOff: '對齊：關閉',
    menuSnapHint: '整頁精準吸附',
    menuMotionFluid: '動態：流暢',
    menuMotionReduced: '動態：減弱',
    menuMotionHint: 'WebGL 動能幾何',
    menuGroupRecording: '簡報錄製',
    menuRecordTitle: '錄製簡報影片',
    menuSlidePace: '每頁秒數：',
    menuPaceDefault: '3.5 秒 (預設)',
    menuPacePaced: '5.0 秒 (舒緩)',
    menuPaceFast: '2.0 秒 (快速)',
    menuGroupShortcuts: '鍵盤快捷鍵',
    
    // Dialogs
    shortcutsHeading: '鍵盤快捷鍵一覽',
    shortcutNext: '下一頁',
    shortcutPrev: '上一頁',
    shortcutRestart: '重新播放簡報',
    shortcutMotion: '切換減弱動態',
    dialogEscClose: '按 Esc 鍵即可關閉。',
    
    // Font Modal
    fontModalBadge: 'GOOGLE FONTS 字型引擎',
    fontModalHeading: '字型與字重調色盤',
    fontModalSub: '選擇策劃之編輯字型組合，或自訂 Google 字型與極致字重（從極細 Thin 至超黑 Black）。',
    tabCuratedPairings: '精選字型組合',
    tabCustomFonts: '自訂 GOOGLE 字型與字重',
    labelDisplayFont: '標題字型 (DISPLAY FONT)',
    labelBodyFont: '內文字型 (BODY FONT)',
    labelDisplayWeight: '標題字重',
    labelBodyWeight: '內文字重',
    btnApplyTypography: '套用自訂字型',
    btnResetTypography: '重設預設字型',
    
    // Theme Modal
    themeModalBadge: '色彩演色引擎',
    themeModalHeading: '色彩主題與調色盤',
    themeModalSub: '選擇精選展覽色彩主題（包含黑曜石/鎘橘與陶瓷/鈷藍），或建立專屬的自訂色譜。',
    tabCuratedThemes: '精選主題',
    tabCustomTheme: '自訂調色盤建立器',
    labelBgMode: '背景色彩模式',
    modeDark: '深色 (鈦金屬 / 黑曜石基底)',
    modeLight: '淺色 (陶瓷白 / 建築雪花石)',
    labelAccentColor: '重點強調色彩',
    quickSwatchesLabel: '快速色彩範本',
    btnApplyTheme: '套用自訂色彩主題',
    btnResetTheme: '重設為展覽預設主題',
    
    // Studio
    studioBadge: '簡報創作工坊',
    studioHeading: '簡報編輯工坊',
    tabSlideContent: '投影片內容',
    tabObjectPose: '3D 物件姿態',
    tabImportExport: '匯出 / 匯入',
    labelSuperTitle: '章節標籤 / 小標題',
    labelSlideTitle: '投影片主標題',
    labelThesis: '核心論點',
    labelBody: '詳細內文論述',
    label3DModel: '3D 主體幾何模型',
    btnApplyPreset: '套用姿態預設',
    btnExportJSON: '匯出投影片 JSON',
    btnImportJSON: '匯入投影片 JSON',
    btnResetDefault: '重設為範本預設值'
  }
};
