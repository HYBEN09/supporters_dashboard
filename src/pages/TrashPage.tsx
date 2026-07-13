import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/useAuth";
import { useIssues } from "../features/issues/useIssues";
import { loadDeletedIssuesFromStorage } from "../services/issueStorage";
import type { IssueItem } from "../types/issue";
import { AuthGate } from "../components/auth/AuthGate";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatDate, getIssueJiraLinks } from "../utils/formatters";
import styles from "./TrashPage.module.css";

const RETENTION_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getRemainingDays(deletedAt: string) {
  const elapsedDays = Math.floor((Date.now() - new Date(deletedAt).getTime()) / DAY_IN_MS);

  return RETENTION_DAYS - elapsedDays;
}

export function TrashPage() {
  const { isAuthenticated } = useAuth();
  const { permanentlyDeleteIssue, restoreIssue } = useIssues();
  const [deletedIssues, setDeletedIssues] = useState<IssueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    loadDeletedIssuesFromStorage()
      .then((issues) => {
        if (!isMounted) {
          return;
        }

        const validIssues: IssueItem[] = [];

        issues.forEach((issue) => {
          if (!issue.deletedAt) {
            validIssues.push(issue);
            return;
          }

          if (getRemainingDays(issue.deletedAt) <= 0) {
            permanentlyDeleteIssue(issue.id);
            return;
          }

          validIssues.push(issue);
        });

        setDeletedIssues(validIssues);
        setError("");
      })
      .catch(() => {
        if (isMounted) {
          setError("휴지통 데이터를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, permanentlyDeleteIssue]);

  function handleRestore(issue: IssueItem) {
    restoreIssue(issue);
    setDeletedIssues((current) => current.filter((item) => item.id !== issue.id));
  }

  function handlePermanentDelete(issue: IssueItem) {
    if (
      !window.confirm(
        `${issue.id} 제보를 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }

    permanentlyDeleteIssue(issue.id);
    setDeletedIssues((current) => current.filter((item) => item.id !== issue.id));
  }

  if (!isAuthenticated) {
    return (
      <section className={styles.listPanel}>
        <AuthGate
          description={
            <>
              휴지통을 보려면 로그인이 필요합니다.
              <br />
              우측 상단의 로그인 버튼을 이용해주세요.
            </>
          }
          title="로그인이 필요합니다"
        />
      </section>
    );
  }

  return (
    <section className={styles.listPanel}>
      <div className={styles.listHeader}>
        <div>
          <h1>휴지통</h1>
          <p>삭제된 이슈는 30일간 보관되며, 이후 자동으로 영구 삭제됩니다.</p>
        </div>
        <span>
          <strong>{deletedIssues.length}</strong>개 항목
        </span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <colgroup>
            <col className={styles.dateColumn} />
            <col className={styles.authorColumn} />
            <col className={styles.serviceColumn} />
            <col className={styles.platformColumn} />
            <col className={styles.statusColumn} />
            <col className={styles.statusColumn} />
            <col className={styles.reasonColumn} />
            <col className={styles.jiraColumn} />
            <col className={styles.dateColumn} />
            <col className={styles.ddayColumn} />
            <col className={styles.actionsColumn} />
          </colgroup>
          <thead>
            <tr>
              <th>등록일</th>
              <th>작성자</th>
              <th>서비스</th>
              <th>플랫폼</th>
              <th>이슈 여부</th>
              <th>수정 여부</th>
              <th>이슈 아님 사유</th>
              <th>Jira 링크</th>
              <th>삭제일</th>
              <th>보관 만료까지</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className={styles.empty} colSpan={11}>
                  불러오는 중...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className={styles.empty} colSpan={11}>
                  {error}
                </td>
              </tr>
            ) : deletedIssues.length > 0 ? (
              deletedIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className={styles.nowrapCell}>{formatDate(issue.registeredAt)}</td>
                  <td>{issue.authorName || "-"}</td>
                  <td>{issue.serviceName}</td>
                  <td>{issue.platform}</td>
                  <td>
                    <StatusBadge value={issue.issueStatus} />
                  </td>
                  <td>
                    <StatusBadge value={issue.fixStatus} />
                  </td>
                  <td>{issue.notIssueReason ?? "-"}</td>
                  <td>
                    {getIssueJiraLinks(issue).length > 0 ? (
                      <div className={styles.jiraLinks}>
                        {getIssueJiraLinks(issue).map((link) => (
                          <a
                            href={link.url}
                            key={`${link.label}-${link.url}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className={styles.nowrapCell}>
                    {issue.deletedAt ? formatDate(issue.deletedAt.slice(0, 10)) : "-"}
                  </td>
                  <td>
                    {issue.deletedAt ? (
                      <span className={styles.ddayBadge}>
                        D-{getRemainingDays(issue.deletedAt)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <Button variant="secondary" onClick={() => handleRestore(issue)}>
                        복원
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handlePermanentDelete(issue)}
                      >
                        영구 삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.empty} colSpan={11}>
                  휴지통이 비어 있습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
