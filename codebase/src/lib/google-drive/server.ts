import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
export const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";
export const PDF_MIME_TYPE = "application/pdf";
const DRIVE_FILE_FIELDS =
  "nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,iconLink,size)";
const DRIVE_FILE_METADATA_FIELDS =
  "id,name,mimeType,modifiedTime,webViewLink,iconLink,size";

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  size?: string;
};

export type GoogleDriveFileList = {
  files: GoogleDriveFile[];
  nextPageToken?: string;
};

export class GoogleDriveConnectorError extends Error {
  constructor(
    public code:
      | "unauthenticated"
      | "reconnect_required"
      | "drive_request_failed"
      | "unsupported_file_type",
    message: string,
    public status = 500,
  ) {
    super(message);
    this.name = "GoogleDriveConnectorError";
  }
}

export async function getGoogleDriveStatus() {
  const token = await getGoogleProviderToken();

  await listGoogleDriveFiles(token, { pageSize: 1 });

  return { connected: true };
}

export async function getAuthenticatedGoogleDriveContext() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new GoogleDriveConnectorError(
      "unauthenticated",
      "Supabase is not configured.",
      401,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new GoogleDriveConnectorError(
      "unauthenticated",
      "Sign in before connecting Google Drive.",
      401,
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    throw new GoogleDriveConnectorError(
      "reconnect_required",
      "Reconnect Google with Drive readonly access.",
      401,
    );
  }

  return {
    supabase,
    user: user as User,
    googleAccessToken: session.provider_token,
  };
}

export async function listGoogleDriveViewableFiles({
  pageSize,
  pageToken,
  search,
}: {
  pageSize?: number;
  pageToken?: string | null;
  search?: string | null;
}) {
  const token = await getGoogleProviderToken();

  return listGoogleDriveFiles(token, { pageSize, pageToken, search });
}

export async function getGoogleDriveFileMetadata(token: string, fileId: string) {
  const url = new URL(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}`);
  url.searchParams.set("fields", DRIVE_FILE_METADATA_FIELDS);

  const response = await fetchGoogleDrive(url, token);

  return (await response.json()) as GoogleDriveFile;
}

export async function importGoogleDriveFileText(
  token: string,
  file: GoogleDriveFile,
) {
  if (file.mimeType === GOOGLE_DOC_MIME_TYPE) {
    return {
      text: await exportGoogleDocAsPlainText(token, file.id),
      needsReviewReason: null,
    };
  }

  if (file.mimeType === PDF_MIME_TYPE) {
    await downloadGoogleDriveFile(token, file.id);

    return {
      text: "",
      needsReviewReason:
        "PDF text extraction is not configured yet. The file was reachable in Drive, but needs review before scanning.",
    };
  }

  throw new GoogleDriveConnectorError(
    "unsupported_file_type",
    "Only Google Docs and PDFs can be imported.",
    400,
  );
}

async function getGoogleProviderToken() {
  const { googleAccessToken } = await getAuthenticatedGoogleDriveContext();

  return googleAccessToken;
}

async function listGoogleDriveFiles(
  token: string,
  {
    pageSize = 25,
    pageToken,
    search,
  }: {
    pageSize?: number;
    pageToken?: string | null;
    search?: string | null;
  } = {},
): Promise<GoogleDriveFileList> {
  const url = new URL(DRIVE_FILES_URL);
  url.searchParams.set("pageSize", String(clampPageSize(pageSize)));
  url.searchParams.set("fields", DRIVE_FILE_FIELDS);
  url.searchParams.set("orderBy", "modifiedTime desc");
  url.searchParams.set("q", buildDriveQuery(search));

  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const response = await fetchGoogleDrive(url, token);

  return (await response.json()) as GoogleDriveFileList;
}

async function exportGoogleDocAsPlainText(token: string, fileId: string) {
  const url = new URL(
    `${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}/export`,
  );
  url.searchParams.set("mimeType", "text/plain");

  const response = await fetchGoogleDrive(url, token, "text/plain");

  return response.text();
}

async function downloadGoogleDriveFile(token: string, fileId: string) {
  const url = new URL(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}`);
  url.searchParams.set("alt", "media");

  const response = await fetchGoogleDrive(url, token, "application/pdf");

  return response.arrayBuffer();
}

async function fetchGoogleDrive(
  url: URL,
  token: string,
  accept = "application/json",
) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new GoogleDriveConnectorError(
      "reconnect_required",
      "Reconnect Google with Drive readonly access.",
      401,
    );
  }

  if (!response.ok) {
    throw new GoogleDriveConnectorError(
      "drive_request_failed",
      "Google Drive request failed.",
      response.status,
    );
  }

  return response;
}

function buildDriveQuery(search?: string | null) {
  const parts = [
    "trashed = false",
    `(mimeType = '${GOOGLE_DOC_MIME_TYPE}' or mimeType = '${PDF_MIME_TYPE}')`,
  ];

  if (search?.trim()) {
    parts.push(`name contains '${escapeDriveQueryValue(search.trim())}'`);
  }

  return parts.join(" and ");
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function clampPageSize(pageSize: number) {
  if (!Number.isFinite(pageSize)) {
    return 25;
  }

  return Math.min(Math.max(Math.trunc(pageSize), 1), 100);
}
