import { useEffect, useState } from "react";
import { NOT_ISSUE_REASON_OPTIONS } from "../../data/filterOptions";
import styles from "./NotIssueReasonHelp.module.css";

const NOT_ISSUE_REASON_DESCRIPTIONS: Record<
  (typeof NOT_ISSUE_REASON_OPTIONS)[number],
  string
> = {
  "정상 작동(이슈 재현 안됨)": "확인했으나 문제가 나타나지 않음",
  "이슈 재현 어려움": "화면·기능에 접근할 수 없어 재현 불가",
  "접근성 이슈 아님": "문제처럼 보이나 실제로는 접근·이용 가능",
  "사용성 이슈": "접근성과 무관한 전체 사용자 공통 불편",
  "실행 경로 불명확": "제보 정보가 부족해 위치를 특정할 수 없음",
  "기능 개발 요청": "오류가 아닌 신규 기능 요청",
  "보조기술 이슈": "스크린리더 등 보조기술 자체의 문제",
  "윈도우/브라우저 자체 기능": "운영체제·브라우저의 기본 동작",
};

export function NotIssueReasonHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <span className={styles.wrap}>
      <button
        aria-expanded={isOpen}
        aria-label="이슈 아님 사유 설명 보기"
        className={styles.trigger}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        ?
      </button>
      {isOpen ? (
        <>
          <div
            className={styles.backdrop}
            role="presentation"
            onClick={() => setIsOpen(false)}
          />
          <div
            aria-labelledby="not-issue-reason-help-title"
            className={styles.callout}
            role="dialog"
          >
            <div className={styles.calloutHeader}>
              <strong id="not-issue-reason-help-title">이슈 아님 사유 안내</strong>
              <button
                aria-label="이슈 아님 사유 안내 닫기"
                className={styles.closeButton}
                type="button"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            <ol className={styles.list}>
              {NOT_ISSUE_REASON_OPTIONS.map((reason, index) => (
                <li key={reason}>
                  <span className={styles.number} aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <strong>{reason}</strong>
                    <p>{NOT_ISSUE_REASON_DESCRIPTIONS[reason]}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : null}
    </span>
  );
}
