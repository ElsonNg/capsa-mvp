import { NextResponse, type NextRequest } from "next/server";
import {
  GoogleDriveConnectorError,
  listGoogleDriveViewableFiles,
} from "@/lib/google-drive/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageSize = Number(searchParams.get("pageSize") ?? "25");
  const pageToken = searchParams.get("pageToken");
  const search = searchParams.get("search");

  try {
    const fileList = await listGoogleDriveViewableFiles({
      pageSize,
      pageToken,
      search,
    });

    return NextResponse.json(fileList);
  } catch (error) {
    if (error instanceof GoogleDriveConnectorError) {
      return NextResponse.json(
        {
          files: [],
          code: error.code,
          reason: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        files: [],
        code: "drive_request_failed",
        reason: "Could not list Google Drive files.",
      },
      { status: 500 },
    );
  }
}
