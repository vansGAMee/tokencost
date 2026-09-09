type ReceiptData = {
  code: string;
  cost: string;
  language: string;
  model: string;
  provider: string;
  tokens: string;
};

const KEYWORDS = new Set([
  "async",
  "await",
  "auto",
  "class",
  "const",
  "double",
  "else",
  "export",
  "float",
  "for",
  "from",
  "function",
  "if",
  "import",
  "include",
  "int",
  "interface",
  "let",
  "namespace",
  "private",
  "public",
  "return",
  "std",
  "struct",
  "template",
  "typename",
  "using",
  "var",
  "void",
  "while",
]);

function drawCodeLine(
  context: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
) {
  const matcher =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\/\/.*$)/g;
  let cursor = x;
  let lastIndex = 0;

  for (const match of line.matchAll(matcher)) {
    const index = match.index ?? 0;
    const plain = line.slice(lastIndex, index);
    context.fillStyle = "#34373b";
    context.fillText(plain, cursor, y);
    cursor += context.measureText(plain).width;

    const token = match[0];
    if (token.startsWith("//")) context.fillStyle = "#8a8982";
    else if (token.startsWith('"') || token.startsWith("'"))
      context.fillStyle = "#a25a2b";
    else if (/^\d/.test(token)) context.fillStyle = "#985079";
    else if (KEYWORDS.has(token)) context.fillStyle = "#4d58c8";
    else if (/^[A-Z]/.test(token)) context.fillStyle = "#1f7488";
    else context.fillStyle = "#34373b";
    context.fillText(token, cursor, y);
    cursor += context.measureText(token).width;
    lastIndex = index + token.length;
    if (token.startsWith("//")) break;
  }

  const rest = line.slice(lastIndex);
  context.fillStyle = "#34373b";
  context.fillText(rest, cursor, y);
}

export function renderShareReceipt(data: ReceiptData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 800;
  const context = canvas.getContext("2d");
  if (!context)
    return Promise.reject(
      new Error("PNG rendering is not supported in this browser"),
    );

  context.fillStyle = "#f5f4ef";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#111214";
  context.fillRect(0, 0, canvas.width, 82);
  context.fillStyle = "#f8f7f2";
  context.font = "600 29px Georgia, serif";
  context.fillText("tokencost", 52, 53);
  context.fillStyle = "#a9a9a3";
  context.font = "500 14px ui-monospace, SFMono-Regular, Consolas, monospace";
  context.textAlign = "right";
  context.fillText("CODE COST RECEIPT", 1148, 51);
  context.textAlign = "left";

  context.fillStyle = "#777972";
  context.font = "600 14px ui-monospace, SFMono-Regular, Consolas, monospace";
  context.fillText(`${data.provider.toUpperCase()}  /  ${data.model}`, 52, 128);
  const gradient = context.createLinearGradient(50, 0, 760, 0);
  gradient.addColorStop(0, "#090a0b");
  gradient.addColorStop(0.22, "#3f4247");
  gradient.addColorStop(0.43, "#17181a");
  gradient.addColorStop(0.66, "#75777a");
  gradient.addColorStop(0.82, "#4f4c45");
  gradient.addColorStop(1, "#111214");
  context.fillStyle = gradient;
  context.font = "600 92px Arial, sans-serif";
  context.fillText(data.cost, 47, 230);
  context.fillStyle = "#777972";
  context.font = "500 18px ui-monospace, SFMono-Regular, Consolas, monospace";
  context.fillText(`${data.tokens} INPUT TOKENS`, 56, 270);

  context.fillStyle = "#fbfbf8";
  context.strokeStyle = "#d9d9d4";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(48, 304, 1104, 420, 18);
  context.fill();
  context.stroke();

  context.fillStyle = "#efeee9";
  context.fillRect(50, 306, 66, 416);
  context.font = "500 19px ui-monospace, SFMono-Regular, Consolas, monospace";
  const lines = data.code.split("\n").slice(0, 12);
  lines.forEach((line, index) => {
    const y = 350 + index * 29;
    context.fillStyle = "#999a94";
    context.textAlign = "right";
    context.fillText(String(index + 1), 94, y);
    context.textAlign = "left";
    drawCodeLine(context, line.slice(0, 94), 142, y);
  });

  context.fillStyle = "#777972";
  context.font = "600 13px ui-monospace, SFMono-Regular, Consolas, monospace";
  context.fillText(data.language.toUpperCase(), 52, 765);
  context.textAlign = "right";
  context.fillText("PRIVATE SHARE  ·  TOKENCOST 2026", 1148, 765);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not render PNG")),
      "image/png",
    );
  });
}
