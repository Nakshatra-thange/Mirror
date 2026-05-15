import { useEffect, useRef, useCallback } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { socket } from "../../lib/socket";
import { LanguageValue } from "../../constants/languages";

interface CursorDecoration {
  userId: string;
  name: string;
  decoration: string[]; // Monaco decoration IDs
}

interface Props {
  roomCode: string;
  userId: string;
  userName: string;
  language: LanguageValue;
  value: string;
  onChange: (code: string) => void;
  onLanguageChange?: (lang: LanguageValue) => void;
  readOnly?: boolean;
}

// Colors for collaborator cursors
const CURSOR_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6"];
let colorIndex = 0;
const userColors: { [userId: string]: string } = {};

function getColorForUser(userId: string) {
  if (!userColors[userId]) {
    userColors[userId] = CURSOR_COLORS[colorIndex % CURSOR_COLORS.length];
    colorIndex++;
  }
  return userColors[userId];
}

export default function CollabEditor({
  roomCode, userId, userName, language, value, onChange, readOnly = false
}: Props) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationsRef = useRef<{ [socketId: string]: CursorDecoration }>({});
  const isRemoteChange = useRef(false);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Request current state from room
    socket.emit("editor:request_sync", { roomCode });

    // Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      socket.emit("editor:cursor", {
        roomCode,
        userId,
        name: userName,
        cursor: {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        },
      });
    });
  };

  const handleChange: OnChange = useCallback((newValue) => {
    if (isRemoteChange.current) return;
    const code = newValue ?? "";
    onChange(code);
    socket.emit("editor:change", { roomCode, code, language });
  }, [roomCode, language, onChange]);

  // Socket listeners
  useEffect(() => {
    // Full sync when joining mid-session
    socket.on("editor:full_sync", ({ code, language: lang }) => {
      isRemoteChange.current = true;
      onChange(code);
      isRemoteChange.current = false;
    });

    // Incremental change from other user
    socket.on("editor:change", ({ code }) => {
      if (!editorRef.current) return;
      isRemoteChange.current = true;

      const model = editorRef.current.getModel();
      if (!model) return;

      // Preserve cursor position
      const pos = editorRef.current.getPosition();
      model.setValue(code);
      if (pos) editorRef.current.setPosition(pos);

      onChange(code);
      isRemoteChange.current = false;
    });

    // Remote cursor
    socket.on("editor:cursor", ({ cursor, userId: remoteId, name, socketId }) => {
      if (!editorRef.current || !monacoRef.current) return;
      if (remoteId === userId) return;

      const monaco = monacoRef.current;
      const color = getColorForUser(remoteId);

      // Inject CSS for this cursor color if not already done
      const styleId = `cursor-style-${remoteId}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          .cursor-${remoteId} { 
            border-left: 2px solid ${color} !important; 
          }
          .cursor-label-${remoteId}::after {
            content: "${name}";
            background: ${color};
            color: #000;
            font-size: 11px;
            padding: 1px 4px;
            border-radius: 2px;
            position: absolute;
            top: -18px;
            left: 0;
            white-space: nowrap;
            pointer-events: none;
          }
        `;
        document.head.appendChild(style);
      }

      const newDecorations = editorRef.current.deltaDecorations(
        decorationsRef.current[socketId]?.decoration ?? [],
        [
          {
            range: new monaco.Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column),
            options: {
              className: `cursor-${remoteId}`,
              beforeContentClassName: `cursor-label-${remoteId}`,
            },
          },
        ]
      );

      decorationsRef.current[socketId] = { userId: remoteId, name, decoration: newDecorations };
    });

    // Clean up cursor when user leaves
    socket.on("editor:cursor_remove", ({ socketId }) => {
      if (!editorRef.current || !decorationsRef.current[socketId]) return;
      editorRef.current.deltaDecorations(decorationsRef.current[socketId].decoration, []);
      delete decorationsRef.current[socketId];
    });

    return () => {
      socket.off("editor:full_sync");
      socket.off("editor:change");
      socket.off("editor:cursor");
      socket.off("editor:cursor_remove");
    };
  }, [userId, onChange]);

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onMount={handleMount}
      onChange={handleChange}
      theme="vs-dark"
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        renderLineHighlight: "all",
        cursorBlinking: "smooth",
        smoothScrolling: true,
        padding: { top: 16 },
        readOnly,
      }}
    />
  );
}