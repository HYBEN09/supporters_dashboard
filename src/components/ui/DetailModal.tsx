import type { IssueItem } from "../../types/issue";
import { createJiraUrl, formatDate } from "../../utils/formatters";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";
import styles from "./DetailModal.module.css";

type DetailModalProps = {
  issue: IssueItem | null;
  onClose: () => void;
};

export function DetailModal({ issue, onClose }: DetailModalProps) {
  if (!issue) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={styles.modal}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2>제보 상세</h2>
            <p>{issue.id}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>
        <dl className={styles.details}>
          <div>
            <dt>등록일</dt>
            <dd>{formatDate(issue.registeredAt)}</dd>
          </div>
          <div>
            <dt>작성자</dt>
            <dd>{issue.authorName}</dd>
          </div>
          <div>
            <dt>서비스명</dt>
            <dd>{issue.serviceName}</dd>
          </div>
          <div>
            <dt>플랫폼</dt>
            <dd>{issue.platform}</dd>
          </div>
          <div>
            <dt>실행 경로</dt>
            <dd>{issue.path}</dd>
          </div>
          <div>
            <dt>이슈 여부</dt>
            <dd>
              <StatusBadge value={issue.issueStatus} />
            </dd>
          </div>
          <div>
            <dt>수정 여부</dt>
            <dd>
              <StatusBadge value={issue.fixStatus} />
            </dd>
          </div>
          <div>
            <dt>이슈 아님 사유</dt>
            <dd>{issue.notIssueReason ?? "-"}</dd>
          </div>
          <div>
            <dt>지라 카드 번호</dt>
            <dd>
              {issue.jiraKey ? (
                <a href={createJiraUrl(issue.jiraKey)} rel="noreferrer" target="_blank">
                  {issue.jiraKey}
                </a>
              ) : (
                "-"
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
