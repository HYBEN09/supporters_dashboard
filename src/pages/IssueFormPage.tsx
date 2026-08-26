import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  FIX_STATUS_OPTIONS,
  ISSUE_FORM_PLATFORM_OPTIONS,
  ISSUE_FORM_SERVICE_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  NOT_ISSUE_REASON_OPTIONS,
  PERIOD_OPTIONS,
} from "../data/filterOptions";
import { useAuth } from "../features/auth/useAuth";
import { useIssues } from "../features/issues/useIssues";
import { usePeriod } from "../features/period/usePeriod";
import type { IssueFormValues, IssueItem } from "../types/issue";
import { AuthGate } from "../components/auth/AuthGate";
import { Button } from "../components/ui/Button";
import { NotIssueReasonHelp } from "../components/ui/NotIssueReasonHelp";
import {
  fetchSheetReportRows,
  filterUnimportedRows,
  isSheetImportConfigured,
  parseSheetRowsFromPastedText,
  sheetRowToFormValues,
  sheetRowToIssueItem,
  type SheetReportRow,
} from "../services/sheetImport";
import styles from "./IssueFormPage.module.css";

const DRAFT_STORAGE_KEY = "supporters-issue-form-draft";
const AUTO_SAVE_DELAY_MS = 800;

type StoredDraft = {
  savedAt: string;
  values: IssueFormValues;
};

function loadStoredDraft(): StoredDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredDraft;
  } catch {
    return null;
  }
}

function saveStoredDraft(values: IssueFormValues) {
  if (typeof window === "undefined") {
    return null;
  }

  const draft: StoredDraft = { savedAt: new Date().toISOString(), values };
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));

  return draft.savedAt;
}

function clearStoredDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}

function formatSavedTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createServiceJiraField(value = "") {
  return { value };
}

function createDefaultValues(): IssueFormValues {
  return {
    registeredAt: new Date().toISOString().slice(0, 10),
    authorName: "",
    serviceName: "",
    platform: "선택 안 함",
    issueStatus: "",
    fixStatus: "수정 필요",
    notIssueReason: "",
    supporterJiraUrl: "",
    serviceJiraUrls: [createServiceJiraField()],
    memo: "",
  };
}

function getJoinedServiceJiraUrls(values: IssueFormValues) {
  const joinedValue = values.serviceJiraUrls
    .map((item) => item.value.trim())
    .filter(Boolean)
    .join("\n");

  return joinedValue || undefined;
}

export function IssueFormPage() {
  const { isAuthenticated } = useAuth();
  const { addIssue, deleteIssue, issues } = useIssues();
  const { setSelectedPeriodId } = usePeriod();
  const [message, setMessage] = useState("");
  const [sheetImportMessage, setSheetImportMessage] = useState("");
  const [formResetKey, setFormResetKey] = useState(0);
  const [pendingDraft, setPendingDraft] = useState<StoredDraft | null>(() =>
    loadStoredDraft(),
  );
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [sheetPasteText, setSheetPasteText] = useState("");
  const [sheetImportLoading, setSheetImportLoading] = useState(false);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [lastBulkImportBatch, setLastBulkImportBatch] = useState<string[]>(
    [],
  );
  const [bulkPreviewRows, setBulkPreviewRows] = useState<SheetReportRow[]>(
    [],
  );
  const [bulkPreviewSelected, setBulkPreviewSelected] = useState<
    Set<string>
  >(new Set());
  const [bulkPreviewSkippedCount, setBulkPreviewSkippedCount] = useState(0);
  const [sheetImportPendingCount, setSheetImportPendingCount] = useState<
    number | null
  >(null);
  const [loadedSheetTimestamp, setLoadedSheetTimestamp] = useState<
    string | null
  >(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    formState: { errors, isDirty },
    control,
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<IssueFormValues>({ defaultValues: createDefaultValues() });
  const {
    fields: serviceJiraFields,
    append: appendServiceJiraField,
    remove: removeServiceJiraField,
    replace: replaceServiceJiraFields,
  } = useFieldArray({
    control,
    name: "serviceJiraUrls",
  });
  const issueStatus = useWatch({ control, name: "issueStatus" });
  const watchedValues = useWatch({ control });
  const isNotIssue = issueStatus === "이슈 아님";
  const isFixStatusLocked =
    issueStatus === "이슈 아님" || issueStatus === "보류";

  useEffect(() => {
    if (isFixStatusLocked) {
      setValue("fixStatus", "-");
      return;
    }

    if (getValues("fixStatus") === "-") {
      setValue("fixStatus", "수정 필요");
    }
  }, [getValues, isFixStatusLocked, setValue]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const savedAt = saveStoredDraft(getValues());

      if (savedAt) {
        setDraftSavedAt(savedAt);
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [getValues, isDirty, watchedValues]);

  function toIssueItem(values: IssueFormValues): Omit<IssueItem, "id"> {
    return {
      registeredAt: values.registeredAt,
      authorName: values.authorName.trim(),
      serviceName: values.serviceName || "카카오톡",
      platform: values.platform,
      path: "-",
      issueStatus: values.issueStatus || "이슈",
      fixStatus:
        values.issueStatus === "이슈 아님" || values.issueStatus === "보류"
          ? "-"
          : values.fixStatus,
      notIssueReason:
        values.issueStatus === "이슈 아님" && values.notIssueReason
          ? values.notIssueReason
          : undefined,
      supporterJiraUrl: values.supporterJiraUrl.trim() || undefined,
      serviceJiraUrl: getJoinedServiceJiraUrls(values),
      memo: values.memo.trim() || undefined,
      sheetTimestamp: loadedSheetTimestamp ?? undefined,
    };
  }

  function resetIssueForm() {
    const nextDefaultValues = createDefaultValues();

    reset(nextDefaultValues);
    replaceServiceJiraFields(nextDefaultValues.serviceJiraUrls);
    setValue("registeredAt", nextDefaultValues.registeredAt);
    setValue("authorName", nextDefaultValues.authorName);
    setValue("serviceName", nextDefaultValues.serviceName);
    setValue("platform", nextDefaultValues.platform);
    setValue("issueStatus", nextDefaultValues.issueStatus);
    setValue("fixStatus", nextDefaultValues.fixStatus);
    setValue("notIssueReason", nextDefaultValues.notIssueReason);
    setValue("supporterJiraUrl", nextDefaultValues.supporterJiraUrl);
    setValue("serviceJiraUrls", nextDefaultValues.serviceJiraUrls);
    setValue("memo", nextDefaultValues.memo);
    setFormResetKey((current) => current + 1);
  }

  function onSubmit(values: IssueFormValues) {
    const createdIssue = addIssue(toIssueItem(values));
    const period = PERIOD_OPTIONS.find(
      (option) =>
        createdIssue.registeredAt >= option.start &&
        createdIssue.registeredAt <= option.end,
    );

    if (period) {
      setSelectedPeriodId(period.id);
    }

    if (loadedSheetTimestamp) {
      setLoadedSheetTimestamp(null);
      setSheetImportPendingCount((current) =>
        current !== null ? Math.max(0, current - 1) : current,
      );
    }

    clearStoredDraft();
    setDraftSavedAt(null);
    setMessage(`${createdIssue.id} 제보가 등록되었습니다.`);
    resetIssueForm();
  }

  async function importNextSheetRow() {
    setSheetImportMessage("");

    let rows;

    if (isSheetImportConfigured) {
      setSheetImportLoading(true);

      try {
        rows = await fetchSheetReportRows();
      } catch (error) {
        setSheetImportMessage(
          error instanceof Error
            ? error.message
            : "구글 시트에서 가져오는 중 오류가 발생했습니다.",
        );
        return;
      } finally {
        setSheetImportLoading(false);
      }
    } else {
      rows = parseSheetRowsFromPastedText(sheetPasteText);

      if (rows.length === 0) {
        setSheetImportMessage(
          "붙여넣은 내용에서 제보를 찾지 못했습니다. 시트에서 새 행을 복사해 붙여넣어주세요.",
        );
        return;
      }
    }

    const pendingRows = filterUnimportedRows(rows, issues);
    const nextRow = pendingRows[0] ?? null;

    if (!nextRow) {
      setSheetImportPendingCount(0);
      setSheetImportMessage("가져올 새 제보가 없습니다. (이미 이슈 리스트에 있는 건은 자동으로 건너뛰었습니다)");
      return;
    }

    const values = sheetRowToFormValues(nextRow, createDefaultValues());

    reset(values);
    replaceServiceJiraFields(values.serviceJiraUrls);
    setValue("registeredAt", values.registeredAt);
    setValue("authorName", values.authorName);
    setValue("serviceName", values.serviceName);
    setValue("platform", values.platform);
    setValue("issueStatus", values.issueStatus);
    setValue("fixStatus", values.fixStatus);
    setValue("notIssueReason", values.notIssueReason);
    setValue("supporterJiraUrl", values.supporterJiraUrl);
    setValue("serviceJiraUrls", values.serviceJiraUrls);
    setValue("memo", values.memo);
    setFormResetKey((current) => current + 1);

    setLoadedSheetTimestamp(nextRow.timestamp);
    setSheetImportPendingCount(pendingRows.length);
    setSheetImportMessage(
      "구글 시트에서 제보를 불러왔습니다. 이슈 여부/수정 여부를 확인한 뒤 등록해주세요.",
    );
  }

  async function fetchPendingRowsForBulkAction() {
    setSheetImportMessage("");

    let rows;

    if (isSheetImportConfigured) {
      setBulkImportLoading(true);

      try {
        rows = await fetchSheetReportRows();
      } catch (error) {
        setSheetImportMessage(
          error instanceof Error
            ? error.message
            : "구글 시트에서 가져오는 중 오류가 발생했습니다.",
        );
        return null;
      } finally {
        setBulkImportLoading(false);
      }
    } else {
      rows = parseSheetRowsFromPastedText(sheetPasteText);

      if (rows.length === 0) {
        setSheetImportMessage(
          "붙여넣은 내용에서 제보를 찾지 못했습니다. 시트에서 새 행을 복사해 붙여넣어주세요.",
        );
        return null;
      }
    }

    const pendingRows = filterUnimportedRows(rows, issues);
    const skippedCount = rows.length - pendingRows.length;

    if (pendingRows.length === 0) {
      setSheetImportPendingCount(0);
      setSheetImportMessage(
        skippedCount > 0
          ? `가져올 새 제보가 없습니다. (이미 이슈 리스트에 있는 ${skippedCount}건은 건너뛰었습니다)`
          : "가져올 새 제보가 없습니다.",
      );
      return null;
    }

    return { pendingRows, skippedCount };
  }

  async function openBulkImportPreview() {
    const result = await fetchPendingRowsForBulkAction();

    if (!result) {
      return;
    }

    setBulkPreviewRows(result.pendingRows);
    setBulkPreviewSelected(
      new Set(result.pendingRows.map((row) => row.timestamp)),
    );
    setBulkPreviewSkippedCount(result.skippedCount);
  }

  async function bulkImportAllPendingRows() {
    const result = await fetchPendingRowsForBulkAction();

    if (!result) {
      return;
    }

    const { pendingRows, skippedCount } = result;

    const confirmed = window.confirm(
      `${pendingRows.length}건을 이슈 여부 "보류"로 한꺼번에 등록합니다.${
        skippedCount > 0
          ? ` (이미 이슈 리스트에 있는 것으로 보이는 ${skippedCount}건은 자동으로 제외했습니다)`
          : ""
      } 등록 후 목록에서 메모 등 나머지 항목을 입력해주세요. 계속할까요?`,
    );

    if (!confirmed) {
      return;
    }

    let unmatchedServiceCount = 0;
    const createdIds: string[] = [];

    for (const row of pendingRows) {
      const item = sheetRowToIssueItem(row);

      if (item.memo) {
        unmatchedServiceCount += 1;
      }

      const createdIssue = addIssue(item);
      createdIds.push(createdIssue.id);
    }

    setLastBulkImportBatch(createdIds);
    setSheetImportPendingCount(0);
    setSheetImportMessage(
      unmatchedServiceCount > 0
        ? `${pendingRows.length}건이 일괄 등록되었습니다. 이 중 서비스명이 자동 매칭되지 않은 ${unmatchedServiceCount}건은 메모에 원문을 남겨뒀으니 이슈 리스트에서 확인해주세요.`
        : `${pendingRows.length}건이 일괄 등록되었습니다.`,
    );
  }

  function toggleBulkPreviewRow(timestamp: string) {
    setBulkPreviewSelected((current) => {
      const next = new Set(current);

      if (next.has(timestamp)) {
        next.delete(timestamp);
      } else {
        next.add(timestamp);
      }

      return next;
    });
  }

  function toggleBulkPreviewSelectAll() {
    setBulkPreviewSelected((current) =>
      current.size === bulkPreviewRows.length
        ? new Set()
        : new Set(bulkPreviewRows.map((row) => row.timestamp)),
    );
  }

  function cancelBulkPreview() {
    setBulkPreviewRows([]);
    setBulkPreviewSelected(new Set());
    setBulkPreviewSkippedCount(0);
  }

  function confirmBulkImport() {
    const rowsToImport = bulkPreviewRows.filter((row) =>
      bulkPreviewSelected.has(row.timestamp),
    );

    if (rowsToImport.length === 0) {
      return;
    }

    let unmatchedServiceCount = 0;
    const createdIds: string[] = [];

    for (const row of rowsToImport) {
      const item = sheetRowToIssueItem(row);

      if (item.memo) {
        unmatchedServiceCount += 1;
      }

      const createdIssue = addIssue(item);
      createdIds.push(createdIssue.id);
    }

    setLastBulkImportBatch(createdIds);
    setSheetImportPendingCount(
      bulkPreviewRows.length - rowsToImport.length,
    );
    cancelBulkPreview();
    setSheetImportMessage(
      unmatchedServiceCount > 0
        ? `${rowsToImport.length}건이 일괄 등록되었습니다. 이 중 서비스명이 자동 매칭되지 않은 ${unmatchedServiceCount}건은 메모에 원문을 남겨뒀으니 이슈 리스트에서 확인해주세요.`
        : `${rowsToImport.length}건이 일괄 등록되었습니다.`,
    );
  }

  function undoLastBulkImport() {
    if (lastBulkImportBatch.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `방금 일괄 등록한 ${lastBulkImportBatch.length}건을 휴지통으로 이동합니다 (복원 가능). 계속할까요?`,
    );

    if (!confirmed) {
      return;
    }

    lastBulkImportBatch.forEach((issueId) => deleteIssue(issueId));
    setSheetImportPendingCount(
      (current) => (current ?? 0) + lastBulkImportBatch.length,
    );
    setLastBulkImportBatch([]);
    setSheetImportMessage(
      "방금 등록한 건들을 휴지통으로 이동했습니다. 필요하면 이슈 리스트 > 휴지통에서 복원할 수 있습니다.",
    );
  }

  function loadPendingDraft() {
    if (!pendingDraft) {
      return;
    }

    const draftValues = pendingDraft.values;

    reset(draftValues);
    replaceServiceJiraFields(
      draftValues.serviceJiraUrls.length > 0
        ? draftValues.serviceJiraUrls
        : [createServiceJiraField()],
    );
    setValue("registeredAt", draftValues.registeredAt);
    setValue("authorName", draftValues.authorName);
    setValue("serviceName", draftValues.serviceName);
    setValue("platform", draftValues.platform);
    setValue("issueStatus", draftValues.issueStatus);
    setValue("fixStatus", draftValues.fixStatus);
    setValue("notIssueReason", draftValues.notIssueReason);
    setValue("supporterJiraUrl", draftValues.supporterJiraUrl);
    setValue("serviceJiraUrls", draftValues.serviceJiraUrls);
    setValue("memo", draftValues.memo);
    setFormResetKey((current) => current + 1);
    setDraftSavedAt(pendingDraft.savedAt);
    setPendingDraft(null);
    setMessage("임시 저장된 내용을 불러왔습니다.");
  }

  function discardPendingDraft() {
    clearStoredDraft();
    setPendingDraft(null);
  }

  function resetForm() {
    resetIssueForm();
    clearStoredDraft();
    setDraftSavedAt(null);
    setMessage("");
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <section className={styles.panel}>
          <AuthGate
            description={
              <>
                이슈를 등록하려면 로그인이 필요합니다.
                <br />
                우측 상단의 로그인 버튼을 이용해주세요.
              </>
            }
            title="로그인이 필요합니다"
          />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelHeaderTitle}>
            <h2>제보 등록</h2>
            <p>서포터즈 제보 내용을 운영 데이터로 등록합니다.</p>
          </div>
          <span className={styles.requiredGuide}>* 표시는 필수입니다</span>
        </div>

        <div className={styles.sheetImportBanner}>
          <div className={styles.sheetImportHeader}>
            <span className={styles.sheetImportCount}>
              구글 시트에서 가져오기
              {sheetImportPendingCount !== null
                ? ` · 총 ${sheetImportPendingCount}건`
                : ""}
              {sheetImportPendingCount !== null ? (
                <button
                  className={styles.sheetImportDetailButton}
                  disabled={sheetImportLoading || bulkImportLoading}
                  type="button"
                  onClick={openBulkImportPreview}
                >
                  상세보기
                </button>
              ) : null}
            </span>
            {isSheetImportConfigured ? (
              <div className={styles.sheetImportActions}>
                <Button
                  disabled={sheetImportLoading || bulkImportLoading}
                  variant="secondary"
                  onClick={importNextSheetRow}
                >
                  {sheetImportLoading ? "가져오는 중..." : "구글 시트에서 가져오기"}
                </Button>
                <Button
                  disabled={sheetImportLoading || bulkImportLoading}
                  variant="secondary"
                  onClick={bulkImportAllPendingRows}
                >
                  {bulkImportLoading ? "가져오는 중..." : "전체 일괄 등록"}
                </Button>
              </div>
            ) : null}
          </div>
          {!isSheetImportConfigured ? (
            <div className={styles.sheetImportRow}>
              <textarea
                placeholder="시트에서 새 행을 선택해 복사한 뒤 여기에 붙여넣으세요 (Ctrl+V)"
                rows={2}
                value={sheetPasteText}
                onChange={(event) => setSheetPasteText(event.target.value)}
              />
              <div className={styles.sheetImportActions}>
                <Button variant="secondary" onClick={importNextSheetRow}>
                  가져오기
                </Button>
                <Button variant="secondary" onClick={bulkImportAllPendingRows}>
                  전체 일괄 등록
                </Button>
              </div>
            </div>
          ) : null}
          {bulkPreviewRows.length > 0 ? (
            <div className={styles.bulkPreviewPanel}>
              <div className={styles.bulkPreviewHeader}>
                <label className={styles.bulkPreviewSelectAll}>
                  <input
                    checked={
                      bulkPreviewSelected.size === bulkPreviewRows.length
                    }
                    type="checkbox"
                    onChange={toggleBulkPreviewSelectAll}
                  />
                  전체 선택
                </label>
                <span>
                  {bulkPreviewSelected.size} / {bulkPreviewRows.length}건 선택됨
                  {bulkPreviewSkippedCount > 0
                    ? ` · 이미 등록된 ${bulkPreviewSkippedCount}건은 제외됨`
                    : ""}
                </span>
              </div>
              <div className={styles.bulkPreviewList}>
                {bulkPreviewRows.map((row) => (
                  <div className={styles.bulkPreviewRow} key={row.timestamp}>
                    <label className={styles.bulkPreviewCheckboxLabel}>
                      <input
                        checked={bulkPreviewSelected.has(row.timestamp)}
                        type="checkbox"
                        onChange={() => toggleBulkPreviewRow(row.timestamp)}
                      />
                      <span className={styles.bulkPreviewMeta}>
                        <strong>{row.authorName || "(작성자 없음)"}</strong>
                        <span>{row.serviceName || "-"}</span>
                        <span>{row.platform || "-"}</span>
                        <span>{row.timestamp.slice(0, 10)}</span>
                      </span>
                    </label>
                    <div className={styles.bulkPreviewDetail}>
                      {row.path ? (
                        <p>
                          <strong>실행 경로</strong> {row.path}
                        </p>
                      ) : null}
                      <p>
                        <strong>내용</strong> {row.description || "(내용 없음)"}
                      </p>
                      {row.attachment ? (
                        <p>
                          <strong>첨부</strong> {row.attachment}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.bulkPreviewActions}>
                <Button variant="ghost" onClick={cancelBulkPreview}>
                  취소
                </Button>
                <Button
                  disabled={bulkPreviewSelected.size === 0}
                  variant="primary"
                  onClick={confirmBulkImport}
                >
                  선택한 {bulkPreviewSelected.size}건 등록
                </Button>
              </div>
            </div>
          ) : null}
          {sheetImportMessage ? (
            <p className={styles.sheetImportMessage} role="status">
              {sheetImportMessage}
            </p>
          ) : null}
          {lastBulkImportBatch.length > 0 ? (
            <p className={styles.sheetImportMessage} role="status">
              방금 등록한 {lastBulkImportBatch.length}건을 취소하시겠어요?{" "}
              <button
                className={styles.inlineUndoButton}
                type="button"
                onClick={undoLastBulkImport}
              >
                방금 등록한 건 취소
              </button>
            </p>
          ) : null}
        </div>

        {pendingDraft ? (
          <div className={styles.draftBanner}>
            <span>
              임시 저장된 내용이 있습니다 ·{" "}
              {formatSavedTime(pendingDraft.savedAt)} 저장
            </span>
            <div className={styles.draftBannerActions}>
              <Button variant="secondary" onClick={loadPendingDraft}>
                불러오기
              </Button>
              <Button variant="ghost" onClick={discardPendingDraft}>
                삭제
              </Button>
            </div>
          </div>
        ) : null}

        <form
          className={styles.form}
          key={formResetKey}
          onSubmit={handleSubmit(onSubmit)}
        >
          <fieldset className={styles.section}>
            <legend>
              <span>1</span>
              기본 정보
            </legend>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>
                  등록일 <b>*</b>
                </span>
                <input
                  type="date"
                  {...register("registeredAt", {
                    required: "등록일은 필수입니다.",
                  })}
                />
                {errors.registeredAt ? (
                  <em role="alert">{errors.registeredAt.message}</em>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>
                  작성자 이름 <small>선택</small>
                </span>
                <input placeholder="예: 김민준" {...register("authorName")} />
                {errors.authorName ? (
                  <em role="alert">{errors.authorName.message}</em>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>
                  서비스명 <b>*</b>
                </span>
                <select
                  {...register("serviceName", {
                    required: "서비스명은 필수입니다.",
                  })}
                >
                  <option value="">선택</option>
                  {ISSUE_FORM_SERVICE_OPTIONS.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                {errors.serviceName ? (
                  <em role="alert">{errors.serviceName.message}</em>
                ) : null}
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend>
              <span>2</span>
              상태 분류
            </legend>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>플랫폼</span>
                <select
                  {...register("platform", {
                    required: "플랫폼은 필수입니다.",
                  })}
                >
                  {ISSUE_FORM_PLATFORM_OPTIONS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                {errors.platform ? (
                  <em role="alert">{errors.platform.message}</em>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>
                  이슈 여부 <b>*</b>
                </span>
                <select
                  {...register("issueStatus", {
                    required: "이슈 여부는 필수입니다.",
                  })}
                >
                  <option value="">선택</option>
                  {ISSUE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                {errors.issueStatus ? (
                  <em role="alert">{errors.issueStatus.message}</em>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>
                  수정 여부
                  {isFixStatusLocked ? (
                    <small className={styles.locked}>
                      이슈 아님/보류 선택 시 비활성화
                    </small>
                  ) : null}
                </span>
                <select disabled={isFixStatusLocked} {...register("fixStatus")}>
                  {isFixStatusLocked ? <option value="-">-</option> : null}
                  {FIX_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend>
              <span>3</span>
              추가 정보
            </legend>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>
                  이슈 아님 사유
                  <NotIssueReasonHelp />
                  {!isNotIssue ? (
                    <small className={styles.locked}>
                      이슈 아님 선택 시 활성
                    </small>
                  ) : null}
                </span>
                <select disabled={!isNotIssue} {...register("notIssueReason")}>
                  <option value="">선택</option>
                  {NOT_ISSUE_REASON_OPTIONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                <small className={styles.help}>
                  이슈 여부를 이슈 아님으로 선택해야만 활성화됩니다.
                </small>
              </label>

              <div className={`${styles.field} ${styles.wide}`}>
                <span>Jira 링크</span>
                <div className={styles.jiraLinks}>
                  <label>
                    <strong>서포터즈</strong>
                    <input
                      placeholder="https://jira.example.com/browse/SUP-..."
                      type="url"
                      {...register("supporterJiraUrl")}
                    />
                  </label>

                  <div className={styles.serviceJiraGroup}>
                    {serviceJiraFields.map((field, index) => (
                      <label key={field.id}>
                        <strong>서비스 전달</strong>
                        <div className={styles.serviceJiraFieldRow}>
                          <input
                            placeholder="https://jira.daumkakao.com/browse/..."
                            type="url"
                            {...register(`serviceJiraUrls.${index}.value`)}
                          />
                          {serviceJiraFields.length > 1 ? (
                            <button
                              className={styles.serviceJiraRemoveButton}
                              type="button"
                              onClick={() => removeServiceJiraField(index)}
                            >
                              삭제
                            </button>
                          ) : null}
                        </div>
                      </label>
                    ))}

                    <button
                      className={styles.serviceJiraAddButton}
                      type="button"
                      onClick={() =>
                        appendServiceJiraField(createServiceJiraField())
                      }
                    >
                      + 서비스 전달 링크 추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend>
              <span>4</span>
              비고 / 전달 메모
            </legend>
            <label className={`${styles.field} ${styles.full}`}>
              <textarea
                placeholder="추가 메모나 전달 사항을 입력하세요"
                rows={5}
                {...register("memo")}
              />
              <small className={styles.localHint}>
                브라우저 로컬 저장소에 자동 저장됩니다
              </small>
            </label>
          </fieldset>

          {message ? (
            <p className={styles.message} role="status">
              {message}
            </p>
          ) : null}

          <div className={styles.footer}>
            <span className={styles.autoSave}>
              {draftSavedAt
                ? `임시 저장됨 · ${formatSavedTime(draftSavedAt)}`
                : "임시 저장된 내용 없음"}
            </span>
            <div className={styles.actions}>
              <Button variant="ghost" onClick={resetForm}>
                초기화
              </Button>
              <Button type="submit" variant="primary">
                등록
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
