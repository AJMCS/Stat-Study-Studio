// Files the browser tests and the design shots hand to the app, built here so no binary fixture lives in the repo.

/** A small valid PDF with one line of text per page. */
export function makePdf(lines) {
  const objs = [];
  const add = (body) => objs.push(body) && objs.length;
  const pageIds = [];
  add("<</Type/Catalog/Pages 2 0 R>>");
  add("PAGES");
  add("<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>"); // object 3
  for (const line of lines) {
    const content = `BT /F1 14 Tf 72 720 Td (${line}) Tj ET`;
    const contentId = add(`<</Length ${content.length}>>\nstream\n${content}\nendstream`);
    pageIds.push(add(`<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents ${contentId} 0 R/Resources<</Font<</F1 3 0 R>>>>>>`));
  }
  objs[1] = `<</Type/Pages/Kids[${pageIds.map((i) => `${i} 0 R`).join(" ")}]/Count ${pageIds.length}>>`;
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

/** A two-page homework sheet, the fixture a learner hands to "Your own path". */
export const HOMEWORK_LINES = [
  "Homework 2, problem 3. Find the MLE of the rate from the waiting times 2, 4 and 1.",
  "Problem 4. Give the standard error of that estimator and say what it measures.",
];
export const HOMEWORK_PDF = makePdf(HOMEWORK_LINES);
export const HOMEWORK_NAME = "homework-2.pdf";

/** A photo of one homework problem: printed text the browser renders and OCR reads back. */
export const HOMEWORK_PHOTO_NAME = "homework-photo.png";
export const HOMEWORK_PHOTO_HTML = "Problem 5. Waiting times 2, 4 and 1 hours.<br>Find the MLE of the rate and check it is a maximum.";

/** Renders `html` as a picture (PNG bytes) with a page of the given browser context. */
export async function renderPhoto(ctx, html = HOMEWORK_PHOTO_HTML) {
  const tmp = await ctx.newPage();
  await tmp.setContent(`<body style="margin:0;background:#fff"><div style="font:44px Arial;padding:30px;width:1400px;color:#000">${html}</div></body>`);
  const png = await tmp.screenshot({ clip: { x: 0, y: 0, width: 1460, height: 220 } });
  await tmp.close();
  return png;
}
