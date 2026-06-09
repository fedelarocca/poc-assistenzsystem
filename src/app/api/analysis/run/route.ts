import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // 0. Verify Demo Access Token
  const token = request.headers.get("x-demo-token");
  const expectedToken = process.env.DEMO_ACCESS_TOKEN;
  
  if (!expectedToken || expectedToken.trim() === "" || expectedToken === "your_demo_access_token_here") {
    return NextResponse.json(
      { error: "Server-Fehler: Der Demo-Zugangsschlüssel ist serverseitig nicht konfiguriert." },
      { status: 500 }
    );
  }

  if (token !== expectedToken) {
    return NextResponse.json(
      { error: "Nicht autorisierter Zugriff: Der Demo-Token fehlt oder ist ungültig." },
      { status: 401 }
    );
  }

  // 1. Verify Supabase configuration
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: "Supabase ist nicht konfiguriert oder nicht erreichbar." },
      { status: 500 }
    );
  }

  try {
    // 2. Parse request body
    const body = await request.json();
    const { caseId, documentId, prompt, provider, model } = body;

    // 3. Validate input parameters
    if (!caseId) {
      return NextResponse.json({ error: "Fehlende caseId." }, { status: 400 });
    }
    if (!documentId) {
      return NextResponse.json({ error: "Fehlende documentId." }, { status: 400 });
    }
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Der Analyseprompt darf nicht leer sein." }, { status: 400 });
    }
    if (!provider) {
      return NextResponse.json({ error: "Fehlender Provider (google oder openai)." }, { status: 400 });
    }
    if (!model) {
      return NextResponse.json({ error: "Fehlendes Modell." }, { status: 400 });
    }

    // 4. Fetch case metadata to verify it exists
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id, title")
      .eq("id", caseId)
      .single();

    if (caseError || !caseData) {
      console.error("Case fetch error:", caseError);
      return NextResponse.json(
        { error: "Der angegebene Analysefall existiert nicht oder konnte nicht geladen werden." },
        { status: 404 }
      );
    }

    // 5. Fetch document metadata and text layer
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !docData) {
      console.error("Document fetch error:", docError);
      return NextResponse.json(
        { error: "Das angegebene Dokument existiert nicht oder konnte nicht geladen werden." },
        { status: 404 }
      );
    }

    // 6. Verify that document belongs to the case
    if (docData.case_id !== caseId) {
      return NextResponse.json(
        { error: "Dieses Dokument gehört nicht zu dem angegebenen Analysefall." },
        { status: 400 }
      );
    }

    // 7. Verify document has text layer
    if (!docData.extracted_text || !docData.extracted_text.trim()) {
      return NextResponse.json(
        { 
          error: "Für dieses Dokument ist noch keine Textgrundlage vorhanden. Extrahieren Sie zuerst den Text des Dokuments." 
        }, 
        { status: 400 }
      );
    }

    // 8. Cost control: limit the text layer to 20'000 characters
    const MAX_CHAR_LIMIT = 20000;
    const isTruncated = docData.extracted_text.length > MAX_CHAR_LIMIT;
    const textBasis = isTruncated 
      ? docData.extracted_text.substring(0, MAX_CHAR_LIMIT) 
      : docData.extracted_text;

    const truncationNotice = isTruncated
      ? "\n\n[HINWEIS: Die Textgrundlage wurde für die Analyse auf die ersten 20'000 Zeichen gekürzt.]"
      : "";

    // 9. Configure Provider and select model
    let aiModelInstance: any;

    if (provider === "google") {
      const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!googleApiKey || !googleApiKey.trim() || googleApiKey === "your_google_generative_ai_api_key") {
        return NextResponse.json(
          { error: "Google Gemini API Key ist in der Server-Konfiguration nicht hinterlegt (GOOGLE_GENERATIVE_AI_API_KEY fehlt)." },
          { status: 400 }
        );
      }
      
      // Select Google model string (fallback to gemini-1.5-flash if invalid model provided)
      const allowedGoogleModels = ["gemini-3.1-flash-lite", "gemini-3.1-flash", "gemini-3.1-pro", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"];
      if (!allowedGoogleModels.includes(model)) {
        return NextResponse.json({ error: `Ungültiges Google-Modell: ${model}` }, { status: 400 });
      }

      aiModelInstance = google(model);
    } else if (provider === "openai") {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey || !openaiApiKey.trim() || openaiApiKey === "your_openai_api_key") {
        return NextResponse.json(
          { error: "OpenAI API Key ist in der Server-Konfiguration nicht hinterlegt (OPENAI_API_KEY fehlt)." },
          { status: 400 }
        );
      }

      // Select OpenAI model string
      const allowedOpenAIModels = ["gpt-4o-mini", "gpt-4o", "o3-mini"];
      if (!allowedOpenAIModels.includes(model)) {
        return NextResponse.json({ error: `Ungültiges OpenAI-Modell: ${model}` }, { status: 400 });
      }

      aiModelInstance = openai(model);
    } else {
      return NextResponse.json(
        { error: `Nicht unterstützter Provider: ${provider}. Erlaubt sind google oder openai.` },
        { status: 400 }
      );
    }

    // 10. System prompt configuration
    const systemPrompt = `Du bist eine hochspezialisierte Assistenz-KI zur Analyse von Ausschreibungsunterlagen im strategischen Einkauf.
Deine Aufgabe ist es, Dokumenttexte sachlich zu prüfen, Risiken zu identifizieren und prüfrelevante Punkte aufzuzeigen.

Verhaltensregeln:
1. Die Analyse dient ausschliesslich zur betrieblichen Unterstützung. Sie ersetzt KEINE fachliche, rechtliche oder kommerzielle Prüfung.
2. Kennzeichne Unsicherheiten oder Lücken in der Textgrundlage klar und sachlich.
3. Nenne keine erfundenen Quellen, Paragraphen oder Seitenzahlen, wenn diese nicht explizit in der bereitgestellten Textgrundlage stehen.
4. Erfinde keine inhaltlichen Angaben, die sich nicht direkt aus dem Text ableiten lassen.
5. Formuliere absolut sachlich und neutral, ohne übertriebene Adjektive oder Dramatik.
6. Halte dich exakt an die Vorgaben des Benutzers zur Strukturierung.`;

    // 11. Execute generation
    console.log(`Starting AI text generation using provider: ${provider}, model: ${model}`);
    
    const userPrompt = `${prompt}

---
Hier ist die Textgrundlage des Dokuments "${docData.file_name}":
${textBasis}${truncationNotice}`;

    let responseText = "";
    try {
      const { text } = await generateText({
        model: aiModelInstance,
        system: systemPrompt,
        prompt: userPrompt,
      });
      
      responseText = text;
    } catch (genError: any) {
      console.error("Vercel AI SDK generation error:", genError);
      return NextResponse.json(
        { error: `KI-Aufruf fehlgeschlagen: ${genError.message || genError}` },
        { status: 500 }
      );
    }

    if (!responseText || !responseText.trim()) {
      return NextResponse.json(
        { error: "Die KI hat eine leere Antwort generiert." },
        { status: 500 }
      );
    }

    // 12. Save result in the analysis_results table
    const { data: insertedResult, error: dbInsertError } = await supabase
      .from("analysis_results")
      .insert({
        case_id: caseId,
        document_id: documentId,
        prompt: prompt.trim(),
        result_text: responseText.trim(),
        provider: provider,
        model: model,
        analysis_type: "strategic_purchase",
        error_message: null
      })
      .select()
      .single();

    if (dbInsertError) {
      console.error("Database insert error:", dbInsertError);
      return NextResponse.json(
        { 
          error: `Die Analyse wurde erfolgreich generiert, konnte aber nicht in der Datenbank gespeichert werden: ${dbInsertError.message}` 
        },
        { status: 500 }
      );
    }

    // 13. Return successfully generated and persisted analysis result
    return NextResponse.json({
      success: true,
      message: "Analyse erfolgreich durchgeführt und gespeichert.",
      result: {
        id: insertedResult.id,
        caseId: insertedResult.case_id,
        documentId: insertedResult.document_id,
        prompt: insertedResult.prompt,
        resultText: insertedResult.result_text,
        provider: insertedResult.provider,
        model: insertedResult.model,
        createdAt: insertedResult.created_at,
        isTruncated: isTruncated
      }
    });

  } catch (err: any) {
    console.error("Unexpected error in Analysis Route Handler:", err);
    return NextResponse.json(
      { error: `Ein unerwarteter Serverfehler ist aufgetreten: ${err.message || err}` },
      { status: 500 }
    );
  }
}
