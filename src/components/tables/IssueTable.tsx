import type { IssueItem } from "../../types/issue";
import { formatDate, getIssueJiraLinks } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import styles from "./IssueTable.module.css";

type IssueTableProps = {
  items: IssueItem[];
  showAuthor?: boolean;
  showDetail?: boolean;
  onSelectIssue?: (issue: IssueItem) => void;
};

export function IssueTable({
  items,
  showAuthor = false,
  showDetail = false,
  onSelectIssue,
}: IssueTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>등록일</th>
            {showAuthor ? <th>작성자</th> : null}
            <th>서비스명</th>
            <th>플랫폼</th>
            <th>이슈 여부</th>
            <th>수정 여부</th>
            <th>이슈 아님 사유</th>
            <th>지라 링크</th>
            {showDetail ? <th>상세</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.registeredAt)}</td>
                {showAuthor ? <td>{item.authorName}</td> : null}
                <td>{item.serviceName}</td>
                <td>{item.platform}</td>
                <td>
                  <StatusBadge value={item.issueStatus} />
                </td>
                <td>
                  <StatusBadge value={item.fixStatus} />
                </td>
                <td>{item.notIssueReason ?? "-"}</td>
                <td>
                  {getIssueJiraLinks(item).length > 0 ? (
                    <div className={styles.links}>
                      {getIssueJiraLinks(item).map((link) => (
                        <a
                          className={styles.link}
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
                {showDetail ? (
                  <td>
                    <Button
                      variant="ghost"
                      onClick={() => onSelectIssue?.(item)}
                    >
                      상세
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td className={styles.empty} colSpan={showDetail ? 9 : 8}>
                표시할 데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
