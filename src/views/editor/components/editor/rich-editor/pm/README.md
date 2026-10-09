# PM 引擎层

`usePm`：在 `.writable-edit-mode` 容器内创建 tiptap Editor（schema 复刻生产 .tiptap.ProseMirror 结构），
内容来源 `.reference-dom` innerHTML，变更经克隆序列化回 md（复用 resumeDOMStruct2Markdown）。
