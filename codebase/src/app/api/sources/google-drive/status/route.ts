import { NextResponse } from "next/server";
import {
  getGoogleDriveStatus,
  GoogleDriveConnectorError,
} from "@/lib/google-drive/server";

export async function GET() {
  try {
    const status = await getGoogleDriveStatus();

    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof GoogleDriveConnectorError) {
      return NextResponse.json(
        {
          connected: false,
          code: error.code,
          reason: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        connected: false,
        code: "drive_request_failed",
        reason: "Could not check Google Drive connection.",
      },
      { status: 500 },
    );
  }
}
