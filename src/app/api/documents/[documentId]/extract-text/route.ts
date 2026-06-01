import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../../lib/supabase";

// Define the route params signature
interface RouteParams {
  params: Promise<{
    documentId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: "Supabase ist nicht konfiguriert oder nicht erreichbar." },
      { status: 500 }
    );
  }

  try {
    const resolvedParams = await params;
    const { documentId } = resolvedParams;

    if (!documentId) {
      return NextResponse.json(
        { error: "Ungültige Dokumenten-ID." },
        { status: 400 }
      );
    }

    // 1. Fetch document metadata from database
    const { data: doc, error: dbError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (dbError || !doc) {
      console.error("Database fetch error:", dbError);
      return NextResponse.json(
        { error: "Dokumenten-Metadaten konnten nicht in der Datenbank gefunden werden." },
        { status: 404 }
      );
    }

    if (!doc.storage_path) {
      return NextResponse.json(
        { error: "Kein Speicherpfad (storage_path) für diese Datei in der Datenbank hinterlegt." },
        { status: 400 }
      );
    }

    // 2. Download physical file from Supabase Storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("tender-documents")
      .download(doc.storage_path);

    if (downloadError || !fileBlob) {
      console.error("Storage download error:", downloadError);
      return NextResponse.json(
        { error: `Die Datei konnte nicht aus dem Cloud-Storage geladen werden: ${downloadError?.message || "Fehlender Blob"}` },
        { status: 500 }
      );
    }

    // 3. Convert Blob to Node Buffer
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Determine file extension
    const ext = doc.file_name.split(".").pop()?.toLowerCase() || "";

    let extractedText = "";

    // 5. Perform extraction depending on file extension
    if (ext === "txt") {
      extractedText = buffer.toString("utf8");
    } else if (ext === "pdf") {
      try {
        // Dynamic import / require to prevent bundle issues at build time
        // @ts-ignore
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || "";
      } catch (err: any) {
        console.error("PDF-Parse error:", err);
        return NextResponse.json(
          { error: `Fehler beim PDF-Auslesen. Möglicherweise ist das PDF-Format ungültig oder beschädigt: ${err.message}` },
          { status: 500 }
        );
      }
    } else if (ext === "docx") {
      try {
        // @ts-ignore
        const mammoth = require("mammoth");
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedText = docxResult.value || "";
      } catch (err: any) {
        console.error("Mammoth error:", err);
        return NextResponse.json(
          { error: `Fehler beim DOCX-Auslesen. Die Word-Datei ist möglicherweise beschädigt oder inkompatibel: ${err.message}` },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: `Nicht unterstützter Dateityp (.${ext}). Erlaubt sind nur TXT-, PDF- und DOCX-Dateien.` },
        { status: 400 }
      );
    }

    // 6. Validate extracted text
    const cleanedText = extractedText.trim();
    if (!cleanedText) {
      return NextResponse.json(
        { error: "Es konnte kein Text extrahiert werden. Scan-PDFs/OCR werden in diesem PoC nicht unterstützt." },
        { status: 400 }
      );
    }

    // 7. Update document record in database
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        extracted_text: cleanedText
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: `Die Textgrundlage wurde erfolgreich extrahiert, konnte aber nicht in der Datenbank gespeichert werden: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 8. Return success and preview of extracted text (first 500 chars)
    const previewText = cleanedText.substring(0, 500);

    return NextResponse.json({
      success: true,
      message: "Textgrundlage erfolgreich extrahiert.",
      extractedText: cleanedText,
      preview: previewText
    });

  } catch (err: any) {
    console.error("Extract Route Handler Error:", err);
    return NextResponse.json(
      { error: `Ein unerwarteter Serverfehler ist aufgetreten: ${err.message || err}` },
      { status: 500 }
    );
  }
}
