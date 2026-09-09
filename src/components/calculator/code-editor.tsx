"use client";

import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  language?: string;
};

const premiumHighlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.controlKeyword], color: "#4d58c8", fontWeight: "600" },
  { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: "#8c3f82" },
  { tag: [tags.typeName, tags.className, tags.namespace], color: "#1f7488", fontWeight: "550" },
  { tag: [tags.string, tags.special(tags.string)], color: "#a25a2b" },
  { tag: [tags.number, tags.bool, tags.null], color: "#985079" },
  { tag: [tags.comment, tags.meta], color: "#8a8982", fontStyle: "italic" },
  { tag: [tags.operator, tags.punctuation], color: "#676b78" },
  { tag: [tags.propertyName, tags.attributeName], color: "#276d72" },
  { tag: tags.variableName, color: "#24272a" },
]);

const theme = EditorView.theme({
  "&": { height: "100%", background: "transparent", fontSize: "14px" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    lineHeight: "1.65",
    overflow: "auto",
  },
  ".cm-content": { padding: "16px 0", caretColor: "#3347d8" },
  ".cm-line": { padding: "0 22px" },
  ".cm-gutters": {
    background: "#fafaf8",
    color: "#8a8d89",
    borderRight: "1px solid #e2e2de",
  },
  ".cm-activeLine": { background: "#f4f4f1" },
  ".cm-activeLineGutter": { background: "#f4f4f1", color: "#111" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    background: "#dde2ff !important",
  },
  "&.cm-focused": { outline: "none" },
});

export function CodeEditor({ value, onChange, readOnly = false, language = "typescript" }: Props) {
  const languageSupport = language === "cpp" ? cpp() : javascript({ typescript: language === "typescript" });
  return (
    <CodeMirror
      aria-label={readOnly ? "Shared code" : "Code to measure"}
      value={value}
      height="100%"
      extensions={[
        languageSupport,
        syntaxHighlighting(premiumHighlight),
        theme,
        EditorView.lineWrapping,
      ]}
      onChange={onChange}
      editable={!readOnly}
      readOnly={readOnly}
      basicSetup={{
        foldGutter: false,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
        autocompletion: false,
      }}
    />
  );
}
