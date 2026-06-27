import { useRef, useCallback } from 'react';
import { Bold, Italic } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder = 'Write something...' }) {
  const editorRef = useRef(null);

  const handleInput = useCallback(() => {
    const html = editorRef.current?.innerHTML || '';
    onChange?.(html);
  }, [onChange]);

  const execCommand = useCallback((command) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const handleKeyDown = useCallback((e) => {
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      execCommand('bold');
    }
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      execCommand('italic');
    }
  }, [execCommand]);

  const handlePaste = useCallback((e) => {
    // Paste as plain text to prevent styled content
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  }, [handleInput]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
          title="Bold (⌘B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
          title="Italic (⌘I)"
        >
          <Italic className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Entry content"
        data-placeholder={placeholder}
        className="rich-editor px-1 text-sm"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />
    </div>
  );
}
