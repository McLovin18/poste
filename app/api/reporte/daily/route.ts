import { NextResponse } from 'next/server';
import { getAdminFirestore, getAdmin } from '@/lib/firebaseAdmin';
import { PDFDocument as PDFLib, StandardFonts, rgb } from 'pdf-lib';

async function fetchImageBuffer(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch (e) {
    console.warn('No se pudo descargar imagen para PDF:', url, e);
    return null;
  }
}

async function createDiagnosticPdfBytes(message: string) {
  const pdfDoc = await PDFLib.create();
  const PAGE_SIZE: [number, number] = [595, 842];
  const page = pdfDoc.addPage(PAGE_SIZE);
  const times = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lines = String(message).split('\n');
  let y = 820;
  page.drawText('Error generando reporte', { x: 50, y, size: 16, font: times, color: rgb(0, 0, 0) });
  y -= 30;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: fontSize, font: times, color: rgb(0, 0, 0) });
    y -= fontSize + 4;
    if (y < 50) {
      y = 820;
      pdfDoc.addPage([595, 842]);
    }
  }
  return await pdfDoc.save();
}

async function createReportPdfBytes(posts: any[], dateLabel: string) {
  const pdfDoc = await PDFLib.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const PAGE_SIZE: [number, number] = [595, 842];
  let page = pdfDoc.addPage(PAGE_SIZE);
  const margin = 50;
  let x = margin;
  let y = page.getHeight() - margin;
  const lineHeight = 14;

  page.drawText('Reporte diario de levantamiento de postes', { x: margin, y: y - 6, size: 16, font, color: rgb(0, 0, 0) });
  y -= 30;
  page.drawText(`Fecha: ${dateLabel}`, { x: margin, y: y, size: 12, font });
  y -= 24;

  if (posts.length === 0) {
    page.drawText('No se registraron postes el día de hoy.', { x: margin, y, size: 12, font });
  } else {
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      const title = `${i + 1}. ID: ${p.id_registro || p.id || '-'}  Nombre: ${p.nombre || '-'} `;
      if (y < margin + 100) {
        page = pdfDoc.addPage(PAGE_SIZE);
        y = page.getHeight() - margin;
      }
      page.drawText(title, { x, y, size: 12, font });
      y -= lineHeight;
      const fechaStr = p.fecha?.toDate ? p.fecha.toDate().toLocaleString() : (p.fecha ? String(p.fecha) : '-');
      page.drawText(`   Fecha: ${fechaStr}`, { x, y, size: 10, font });
      y -= lineHeight;
      page.drawText(`   Ubicación: lat ${p.lat || '-'} lng ${p.lng || '-'}`, { x, y, size: 10, font });
      y -= lineHeight;
      page.drawText(`   Creado por: ${p.creadoPorEmail || p.creadoPor || '-'}`, { x, y, size: 10, font });
      y -= lineHeight;

      const fotos = p.fotosURLs || p.imagenes || p.fotos || [];
      if (Array.isArray(fotos) && fotos.length > 0) {
        const thumbs = fotos.slice(0, 3);
        for (const f of thumbs) {
          try {
            const buf = await fetchImageBuffer(f);
            if (!buf) continue;
            const uint8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
            let img;
            // choose embed method by checking header
            const header = String.fromCharCode.apply(null, Array.from(uint8.slice(0, 4)));
            if (header.startsWith('%PDF')) continue;
            if (uint8[0] === 0x89 && uint8[1] === 0x50) {
              img = await pdfDoc.embedPng(uint8);
            } else {
              img = await pdfDoc.embedJpg(uint8);
            }
            const imgDims = img.scale(0.25);
            if (y - imgDims.height < margin) {
              page = pdfDoc.addPage(PAGE_SIZE);
              y = page.getHeight() - margin;
            }
            page.drawImage(img, { x, y: y - imgDims.height, width: imgDims.width, height: imgDims.height });
            y -= imgDims.height + 8;
          } catch (e) {
            // ignore image errors
          }
        }
      }

      y -= 8;
    }
  }

  return await pdfDoc.save();
}

export async function GET() {
  try {
    // compute date range first
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    let arr: any[] = [];
    let usedAdmin = false;

    // Prefer Admin SDK when available (production / when credentials provided)
    const admin = getAdmin();
    if (admin && admin.apps && admin.apps.length > 0) {
      try {
        const adminFs = getAdminFirestore();
        const startTs = admin.firestore.Timestamp.fromDate(start);
        const endTs = admin.firestore.Timestamp.fromDate(end);
        const snap = await adminFs.collection('postes')
          .where('fecha', '>=', startTs)
          .where('fecha', '<=', endTs)
          .get();

        snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }));
        usedAdmin = true;
      } catch (e) {
        console.warn('Admin SDK query failed, attempting REST fallback:', String(e));
      }
    }

    // If Admin SDK was not usable, try REST fallback (requires public API key + project id and permissive rules)
    if (!usedAdmin) {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (apiKey && projectId) {
        const runQueryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

        const structuredQuery = {
          structuredQuery: {
            from: [{ collectionId: 'postes' }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: 'fecha' },
                      op: 'GREATER_THAN_OR_EQUAL',
                      value: { timestampValue: start.toISOString() }
                    }
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: 'fecha' },
                      op: 'LESS_THAN_OR_EQUAL',
                      value: { timestampValue: end.toISOString() }
                    }
                  }
                ]
              }
            },
            orderBy: [{ field: { fieldPath: 'fecha' }, direction: 'DESCENDING' }]
          }
        };

        const rq = await fetch(runQueryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(structuredQuery)
        });

        if (!rq.ok) {
          const txt = await rq.text();
          throw new Error(`Firestore REST error: ${rq.status} ${txt}`);
        }

        const results = await rq.json();
        // results is an array of { document: { name, fields, ... } } entries
        for (const r of results) {
          if (!r.document) continue;
          const doc = r.document;
          const data: any = { id: doc.name.split('/').pop() };
          // convert Firestore value types to simple values (timestamp, string, double, array, etc.)
          const fields = doc.fields || {};
          for (const key of Object.keys(fields)) {
            const v = fields[key];
            if (v.stringValue !== undefined) data[key] = v.stringValue;
            else if (v.integerValue !== undefined) data[key] = Number(v.integerValue);
            else if (v.doubleValue !== undefined) data[key] = Number(v.doubleValue);
            else if (v.timestampValue !== undefined) data[key] = v.timestampValue;
            else if (v.arrayValue !== undefined) {
              data[key] = (v.arrayValue.values || []).map((it: any) => it.stringValue || it.integerValue || it.doubleValue || it.timestampValue || null);
            } else {
              // fallback: store raw
              data[key] = v;
            }
          }
          arr.push(data);
        }
      } else {
        // neither admin nor REST API credentials available: return informative PDF fallback
        const msg = 'Firebase Admin SDK no inicializado y faltan NEXT_PUBLIC_FIREBASE_API_KEY/NEXT_PUBLIC_FIREBASE_PROJECT_ID.';
        console.warn(msg);
        const bytes = await createDiagnosticPdfBytes(msg);
        return new Response(new Uint8Array(bytes), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=report_diario_info.pdf`,
          },
        });
      }
    }
    // (arr already populated by Admin SDK or REST fallback above)

    // Generar PDF using pdf-lib helper
    const bytes = await createReportPdfBytes(arr, start.toLocaleDateString());
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=report_diario_${start.toISOString().slice(0,10)}.pdf`,
      },
    });
  } catch (err) {
    console.error('Error generando reporte:', err);
    const message = err instanceof Error ? `${err.message}\n\n${err.stack || ''}` : String(err);

    // Create a diagnostic PDF so the client can still download something useful
    try {
      const bytes = await createDiagnosticPdfBytes(message);
      return new Response(new Uint8Array(bytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=report_error_${new Date().toISOString().slice(0,10)}.pdf`,
        },
      });
    } catch (e) {
      console.error('Error generando PDF de diagnóstico:', e);
      // Fallback to JSON if PDF generation also fails
      const msg2 = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: 'Error generando reporte', detail: message, pdfFallbackError: msg2 }, { status: 500 });
    }
  }
}
