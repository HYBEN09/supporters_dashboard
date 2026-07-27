export const PERIOD_OPTIONS = [
  {
    id: "2025",
    label: "2025.04.01 - 2026.03.30",
    start: "2025-04-01",
    end: "2026-03-30",
  },
  {
    id: "2026",
    label: "2026.04.01 - 2027.03.30",
    start: "2026-04-01",
    end: "2027-03-30",
  },
] as const;

export const ISSUE_FORM_SERVICE_OPTIONS = [
  "카카오톡",
  "멜론",
  "카카오페이",
  "카카오페이지",
  "카카오맵",
  "카카오T",
  "메이커스",
  "카카오지하철",
  "카카오뱅크",
  "카카오버스",
  "선물하기",
  "카카오내비",
  "카카오택시",
  "톡딜",
  "헤이카카오",
  "다음메일",
] as const;

export const SERVICE_OPTIONS = ISSUE_FORM_SERVICE_OPTIONS;

export const ISSUE_FORM_PLATFORM_OPTIONS = [
  "선택 안 함",
  "Android",
  "iOS",
  "WIN",
  "Watch",
  "Mac",
  "점자정보단말기 한소네6",
  "기타",
] as const;

export const PLATFORM_OPTIONS = ISSUE_FORM_PLATFORM_OPTIONS;

export const ISSUE_STATUS_OPTIONS = ["이슈", "이슈 아님", "보류"] as const;

export const FIX_STATUS_OPTIONS = [
  "수정 필요",
  "수정 완료",
  "수정 불가",
  "장기 미처리",
] as const;

export const NOT_ISSUE_REASON_OPTIONS = [
  "정상 작동(이슈 재현 안됨)",
  "이슈 재현 어려움",
  "접근성 이슈 아님",
  "사용성 이슈",
  "실행 경로 불명확",
  "기능 개발 요청",
  "보조기술 이슈",
  "윈도우/브라우저 자체 기능",
] as const;
