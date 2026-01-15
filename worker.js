// 📧 Cloudflare Worker 邮件发送工具 - 完全独立版本 (无需任何 npm 依赖)
// 直接部署到 Cloudflare Workers，无需构建步骤

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮件发送工具</title>
    <style>
        :root {
            --bg-dark: #222831;
            --bg-card: #393E46;
            --accent: #00ADB5;
            --text-light: #EEEEEE;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-dark);
            color: var(--text-light);
            min-height: 100vh;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 0.95rem; /* Reduce base font size */
        }

        .wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            gap: 0;
            align-items: stretch;
        }
        
        #emailForm {
            width: 100vw;
            height: 100vh; /* Use viewport height directly to ensure full height */
            max-width: none;
        }

        #infoPage {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
            background-color: #393E46;
            border-radius: 4px;
            border: 2px solid var(--bg-dark);
        }
        ::-webkit-scrollbar-thumb:hover { background-color: var(--accent); }

        /* Card Style - Info Page Only */
        .col-card.col-info {
            background: var(--bg-card);
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            padding: 32px;
            display: flex;
            flex-direction: column;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .col-card.col-info:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
            border-color: rgba(0, 173, 181, 0.2);
        }
        
        /* Editor & Preview Panels - Flat Full Screen */
        .col-editor { 
            flex: 1; 
            overflow-y: hidden; 
            display: flex; 
            flex-direction: column;
            background: var(--bg-card);
            padding: 32px;
            border-right: 1px solid rgba(0,0,0,0.3);
        }
        .col-preview { 
            flex: 1; 
            display: flex;
            flex-direction: column;
            background: #2d333b; /* Slightly different bg for distinction */
            padding: 32px;
        }

        .col-info { 
            flex: 1; 
            width: 100%;
            max-width: 600px; /* 稍微调宽信息卡片 */
            margin: auto; 
        }

        /* Editor & Preview Panels - Flat Full Screen */
        .col-editor { 
            flex: 1; 
            overflow-y: hidden; 
            display: flex; 
            flex-direction: column;
            background: var(--bg-card);
            padding: 32px;
            border-right: 1px solid rgba(0,0,0,0.3);
        }
        .col-preview { 
            flex: 1; 
            /* overflow-y: auto; Removed: Handled by #preview */
            display: flex;
            flex-direction: column;
            background: #2d333b; /* Slightly different bg for distinction */
            padding: 32px;
        }

        h1, h2 {
            color: var(--accent);
            margin-bottom: 24px;
            font-size: 1.4rem;
            font-weight: 600;
            padding-bottom: 12px;
            border-bottom: 2px solid rgba(0, 173, 181, 0.2);
            flex-shrink: 0; /* Prevent header from shrinking in flex container */
        }

        .info {
            margin-bottom: 24px;
            font-size: 0.9rem;
            color: rgba(238, 238, 238, 0.7);
            line-height: 1.5;
        }

        .form-row { display: flex; gap: 12px; margin-bottom: 12px; }
        .flex-1 { flex: 1; }
        
        .form-group { margin-bottom: 20px; }
        label {
            display: block;
            margin-bottom: 8px;
            color: var(--text-light);
            font-size: 0.9rem;
            font-weight: 500;
            opacity: 0.9;
        }

        input, textarea {
            width: 100%;
            padding: 12px 14px;
            background: var(--bg-dark);
            border: 2px solid rgba(238, 238, 238, 0.05);
            border-radius: 10px;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            color: var(--text-light);
            font-family: inherit;
        }

        input:hover, textarea:hover {
            border-color: rgba(0, 173, 181, 0.3);
            background: #252b33;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 4px rgba(0, 173, 181, 0.15);
            background: #252b33;
            transform: translateY(-1px);
        }
        
        textarea {
            resize: none;
            font-family: 'Consolas', 'Monaco', monospace;
            flex: 1;
            min-height: 200px;
        }

        /* Toolbar & Attachments */
        .editor-toolbar {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            flex-wrap: wrap;
        }
        .tool-btn {
            background: var(--bg-card);
            border: 1px solid rgba(238, 238, 238, 0.1);
            color: var(--text-light);
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        .tool-btn:hover {
            border-color: var(--accent);
            color: var(--accent);
            background: rgba(0, 173, 181, 0.05);
        }
        .tool-btn svg { width: 16px; height: 16px; }
        
        #attachment-list {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .attachment-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(0,0,0,0.2);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .attachment-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 200px;
        }
        .attachment-size {
            color: rgba(255,255,255,0.4);
            font-size: 0.75rem;
            margin-left: 8px;
        }
        .remove-attachment {
            color: #ef5350;
            cursor: pointer;
            padding: 4px;
            margin-left: 8px;
        }
        .remove-attachment:hover { color: #ff8a80; }

        /* Buttons & Modes */
        .mode-container { display: flex; gap: 10px; margin-bottom: 16px; background: var(--bg-dark); padding: 5px; border-radius: 10px; }
        .mode-btn {
            flex: 1;
            padding: 10px;
            background: transparent;
            color: rgba(238, 238, 238, 0.6);
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
        }
        .mode-btn:hover { color: var(--accent); background: rgba(255,255,255,0.03); }
        .mode-btn.active {
            background: var(--accent);
            color: white;
            box-shadow: 0 2px 10px rgba(0, 173, 181, 0.3);
        }

        button[type="submit"], .theme-btn, .preview-toggle-btn {
            width: 100%;
            padding: 14px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.05rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 20px;
            box-shadow: 0 4px 15px rgba(0, 173, 181, 0.25);
        }
        button[type="submit"]:hover, .theme-btn:hover, .preview-toggle-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 173, 181, 0.4);
            filter: brightness(1.1);
        }
        button:active { transform: translateY(0); }
        
        /* Specific Button overrides */
        .preview-toggle-btn {
            background: var(--bg-dark);
            color: var(--text-light);
            border: 1px solid rgba(238,238,238,0.1);
            box-shadow: none;
        }
        .preview-toggle-btn:hover {
            border-color: var(--accent);
            color: var(--accent);
            background: var(--bg-dark);
        }
        @media (min-width: 1025px) { .preview-toggle-btn { display: none; } }

        /* Messages */
        .message {
            margin-bottom: 20px;
            padding: 16px;
            border-radius: 12px;
            display: none;
            text-align: center;
            font-weight: 600;
            font-size: 1.1rem;
            animation: slideIn 0.3s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .message.success { background: rgba(0, 173, 181, 0.15); color: var(--accent); border: 1px solid rgba(0, 173, 181, 0.3); }
        .message.error { background: rgba(239, 83, 80, 0.15); color: #ef5350; border: 1px solid rgba(239, 83, 80, 0.3); }

        /* Preview Area */
        #preview {
            color: var(--text-light);
            font-size: 1rem;
            line-height: 1.6;
            overflow-wrap: break-word;
            flex: 1;
            overflow-y: auto;
            margin-top: 10px;
            padding-right: 10px; /* Prevent scrollbar overlap */
        }
        #preview a { color: var(--accent); }
        #preview code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; color: var(--accent); }
        /* Reset H1/H2 in preview to avoid confusion with UI headers, but keep basic styling */
        #preview h1, #preview h2 {
            border-bottom: 1px solid rgba(255,255,255,0.1); 
            margin-top: 10px;
            color: #e6e6e6; /* Lighter color than accent for content */
        }
        #preview:empty::before { content: '预览区域...'; color: rgba(238,238,238,0.3); font-style: italic; }
        /* Optimize image display */
        #preview img, .mobile-preview img {
            max-width: 100%;
            max-height: 400px;
            object-fit: contain;
            border-radius: 8px;
            margin: 10px 0;
        }

        /* Mobile */
        @media (max-width: 1024px) {
            body { 
                padding: 0; 
                align-items: flex-start; 
                height: 100vh; /* 强制占满视口 */
                display: block; 
                overflow: hidden; /* 防止 Body 滚动 */
            }
            #emailForm {
                height: 100%;
                max-width: 100%;
            }
            #infoPage {
                height: 100%;
            }
            .wrapper { 
                flex-direction: column; 
                height: 100%; 
                width: 100%;
                gap: 0;
            }
            .col-card, .col-editor, .col-info { 
                width: 100%; 
                margin: 0;
                height: 100%;
                border-radius: 0;
                border: none;
                box-shadow: none;
                padding: 16px;
            }
            /* Center login form on mobile */
            .col-info {
                justify-content: center;
            }
            .col-preview { display: none !important; } /* Hide desktop preview col on mobile */
            .col-editor { 
                overflow-y: auto; /* 允许内部滚动 */
                display: flex;
                flex-direction: column;
            }
            /* 让 textarea 自动填满剩余空间 */
            textarea { 
                flex: 1;
                min-height: 200px; 
                height: auto !important; 
                margin-bottom: 10px;
            }
            h1, h2 { font-size: 1.4rem; margin-bottom: 16px; }
            .mobile-preview {
                display: block;
                margin-top: 16px;
                padding: 16px;
                background: var(--bg-card);
                border-radius: 12px;
                border: 1px solid rgba(0, 173, 181, 0.2);
                min-height: 100px;
                /* 确保预览框不会撑破布局，作为内容流的一部分 */
                flex: 0 0 auto;
            }
            .mode-container, button, .preview-toggle-btn {
                flex: 0 0 auto; /* 防止按钮被压缩 */
            }
        }
        
        /* Autofill fix */
        input:-webkit-autofill, textarea:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px var(--bg-dark) inset !important;
            -webkit-text-fill-color: var(--text-light) !important;
            caret-color: var(--text-light);
        }
    </style>
</head>
<body>
    <div id="infoPage">
        <div class="col-card col-info">
            <h1>邮件信息</h1>
            <div class="form-group">
                <label>发件人名称</label>
                <input type="text" id="from" required placeholder="请输入邮箱签名">
            </div>
            <div class="form-group">
                <label>访问密码</label>
                <input type="password" id="password" required placeholder="请输入访问密码">
            </div>
            <button type="button" id="toEditorBtn" class="theme-btn">下一步，编写内容</button>
            <div class="info" style="margin-bottom: 0; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.1);">
                <p>使用 Resend API 发送</p>
                <p style="font-size: 0.8em; margin-top: 5px;">Secure & Fast</p>
            </div>
        </div>
    </div>
    <form id="emailForm" style="display:none;">
        <div class="wrapper">
            <div class="col-card col-editor">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid rgba(0, 173, 181, 0.2); margin-bottom: 24px; padding-bottom: 12px;">
                    <div style="display:flex; align-items:center;">
                        <h2 style="margin:0; padding:0; border:none;">邮件内容</h2>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button type="button" class="tool-btn" id="btnAddAttachment" style="background: var(--accent); color: white; border: none; box-shadow: 0 4px 6px rgba(0, 173, 181, 0.2);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                            添加附件
                        </button>
                         <input type="file" id="fileInputAttachment" multiple style="display:none;">
                         
                        <!-- Image button hidden but preserved -->
                        <button type="button" class="tool-btn" id="btnInsertImage" style="display:none;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            插入图片
                        </button>
                        <input type="file" id="fileInputImage" accept="image/*" style="display:none;">
                    </div>
                </div>

                <div class="form-row">
                    <div class="flex-1">
                        <input type="email" id="to" placeholder="收件人邮箱" required style="font-weight:600;">
                    </div>
                    <div class="flex-1">
                        <input type="text" id="subject" placeholder="在此输入邮件主题..." required style="font-weight:600;">
                    </div>
                </div>

                <!-- Toolbar removed (content moved to header) -->

                <!-- Mode switching removed, default to Markdown -->
                <textarea id="html" required placeholder="在此编写 Markdown 内容..."></textarea>
                
                <!-- Attachment List -->
                <div id="attachment-list"></div>
                
                <div id="message" class="message"></div>
                <button type="submit">发送邮件</button>
                <button type="button" id="togglePreview" class="preview-toggle-btn">显示预览</button>
                <div id="mobilePreview" class="mobile-preview" style="display:none;"></div>
            </div>
            <div class="col-card col-preview">
                <h2>实时预览</h2>
                <div id="preview"></div>
            </div>
        </div>
    </form>

    <div id="loadingMask" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:none;align-items:center;justify-content:center;z-index:9999;color:white;">加载中...</div>
    <script>
    // Minimal error handler
    window.onerror = function(msg, url, line) {
        console.error("Global error: " + msg + " at " + line);
        // Only alert if it's not a script error (which is usually safe to ignore for UI)
        if (msg.indexOf('Script error') === -1) {
             // alert("JS Error: " + msg); 
        }
    }
    </script>
    <script src="https://fastly.jsdelivr.net/npm/marked@11.1.1/marked.min.js" async onload="window.markedLoaded=true" onerror="console.warn('Marked failed to load')"></script>
    <script>
        const translations = {
            zh: {
                title: '发送邮件',
                subtitle: '支持 Markdown 和 HTML 格式',
                labelFrom: '发件人名称',
                labelTo: '收件人邮箱',
                labelSubject: '邮件主题',
                contentTitle: '邮件内容',
                previewTitle: '实时预览',
                sendBtn: '发送邮件',
                sending: '发送中...',
                success: '邮件发送成功',
                fail: '发送失败',
                footer: '使用 Resend API 发送',
                previewPlaceholder: '预览区域（输入内容后自动显示）',
                sendNew: '发送新邮件'
            },
            en: {
                title: 'Send Email',
                subtitle: 'Supports Markdown and HTML',
                labelFrom: 'Sender Name',
                labelTo: 'Recipient Email',
                labelSubject: 'Subject',
                contentTitle: 'Email Content',
                previewTitle: 'Live Preview',
                sendBtn: 'Send Email',
                sending: 'Sending...',
                success: 'Email sent successfully',
                fail: 'Failed to send',
                footer: 'Powered by Resend API',
                previewPlaceholder: 'Preview area (Auto-updates)',
                sendNew: 'Send New Email'
            }
        };

        let currentLang = 'zh';
        // Always Markdown
        const isMd = true;

        const form = document.getElementById('emailForm');
        const msgDiv = document.getElementById('message');
        const htmlInput = document.getElementById('html');
        const preview = document.getElementById('preview');
        const attachmentListDiv = document.getElementById('attachment-list');
        let attachments = []; // Store { filename, content (base64) }

        function setLang(lang) {
            currentLang = lang;
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.textContent.toLowerCase().includes(lang === 'zh' ? '中' : 'en'));
            });
            
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (translations[lang][key]) {
                    el.textContent = translations[lang][key];
                }
            });
            
            // Update preview placeholder style
            const styleId = 'dynamic-style';
            let style = document.getElementById(styleId);
            if (!style) {
                style = document.createElement('style');
                style.id = styleId;
                document.head.appendChild(style);
            }
            style.textContent = "#preview:empty::before { content: '" + translations[lang].previewPlaceholder + "'; }";
        }

        // Initialize Language
        setLang('zh');

        // Mode switch listeners removed (Always Markdown)

        function triggerAutoResize() {
            if (htmlInput) {
                htmlInput.style.height = '100%';
            }
        }
        // --- File Handling Logic ---

        let insertedImages = {}; // Store { imageId: base64Data }
        let imageCounter = 0;

        // Process Base64 images in content and convert to placeholders
        // function processBase64Images() {
            // Feature removed by request to fix syntax errors
        // }

        // 输入、粘贴都自适应
        if (htmlInput) { 
             htmlInput.removeEventListener('input', updatePreview); // Remove potential duplicates
             htmlInput.addEventListener('input', () => {
                 // processBase64Images(); // Removed
                 updatePreview();
                 triggerAutoResize();
                 resetButtonOnEdit();
             });
             // Also add separate trigger for resize
             htmlInput.addEventListener('input', triggerAutoResize);

             htmlInput.addEventListener('paste', (e) => {
                triggerAutoResize();
                // Process after paste completes
                setTimeout(() => {
                    // processBase64Images(); // Removed
                    updatePreview();
                    resetButtonOnEdit();
                }, 50);
            });
        }
        // 页面加载、窗口变化也自适应
        window.addEventListener('DOMContentLoaded', triggerAutoResize);
        window.addEventListener('resize', triggerAutoResize);
        
        // 兼容自动填充
        setTimeout(triggerAutoResize, 200);

        function updatePreview() {
            let content = '';
            // Generate content
            if (htmlInput.value) {
                // Replace image placeholders with actual base64 data for preview
                let textWithImages = htmlInput.value;
                
                // Handle our placeholder format: ![图片: filename](#imageId)
                Object.keys(insertedImages).forEach(imageId => {
                    // Fixed regex: proper escaping for special characters
                    const regex = new RegExp(\`!\\\\[\u56fe\u7247: ([^\\\\]]+)\\\\]\\\\(#\${imageId}\\\\)\`, 'g');
                    textWithImages = textWithImages.replace(regex, (match, filename) => {
                        return \`![\${filename}](\${insertedImages[imageId]})\`;
                    });
                });
                
                // Always Parse as Markdown
                // Use async loaded marked or fallback
                if (window.marked && window.marked.parse) {
                     try {
                        content = window.marked.parse(textWithImages);
                     } catch(e) { console.error('Markdown parse error', e); content = textWithImages; }
                } else if (typeof marked !== 'undefined' && marked.parse) {
                     content = marked.parse(textWithImages);
                } else {
                    content = textWithImages; // Fallback if marked not loaded
                }
            } else {
                content = '';
            }

            // Update Desktop Preview
            if (preview) {
                preview.innerHTML = content;
            }

            // Update Mobile Preview
            const mobilePreview = document.getElementById('mobilePreview');
            if (mobilePreview) {
                if (content) {
                    mobilePreview.innerHTML = content;
                } else {
                    mobilePreview.innerHTML = '<span style="color:rgba(238,238,238,0.3);font-style:italic;">预览区域（输入内容后自动显示）</span>';
                }
            }
        }

        // Helper: Convert File to Base64
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result); // Returns "data:mime;base64,..."
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        }

        // 1. Insert Image
        const btnInsertImage = document.getElementById('btnInsertImage');
        const fileInputImage = document.getElementById('fileInputImage');
        
        if (btnInsertImage && fileInputImage) {
            // Disabled by request
            btnInsertImage.style.display = 'none';
            // btnInsertImage.onclick = ...
        }

        // 2. Attachments
        const btnAddAttachment = document.getElementById('btnAddAttachment');
        const fileInputAttachment = document.getElementById('fileInputAttachment');

        function renderAttachments() {
            if (!attachmentListDiv) return;
            attachmentListDiv.innerHTML = '';
            attachments.forEach((att, index) => {
                const item = document.createElement('div');
                item.className = 'attachment-item';
                const sizeKB = (att.size / 1024).toFixed(1);
                // Use single escape \${} for client-side interpolation
                
                item.innerHTML = \`
                    <div style="display:flex;align-items:center;overflow:hidden;">
                        <span class="attachment-name" title="\${att.filename}">\${att.filename}</span>
                        <span class="attachment-size">\${sizeKB} KB</span>
                    </div>
                    <span class="remove-attachment" onclick="removeAttachment(\${index})">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </span>
                \`;
                attachmentListDiv.appendChild(item);
            });
        }

        window.removeAttachment = function(index) {
            attachments.splice(index, 1);
            renderAttachments();
        };

        if (btnAddAttachment && fileInputAttachment) {
            btnAddAttachment.onclick = () => fileInputAttachment.click();
            
            fileInputAttachment.onchange = async (e) => {
                const files = Array.from(e.target.files);
                if (!files.length) return;

                for (const file of files) {
                    if (attachments.some(a => a.filename === file.name && a.size === file.size)) continue;
                    try {
                        const dataUrl = await fileToBase64(file);
                        const pureBase64 = dataUrl.split(',')[1]; 

                        attachments.push({
                            filename: file.name,
                            content: pureBase64,
                            size: file.size
                        });
                    } catch (err) {
                        console.error(err);
                        alert(\`文件 \${file.name} 读取失败\`);
                    }
                }
                renderAttachments();
                fileInputAttachment.value = '';
            };
        }

        // Safely call updatePreview
        // Removed explicit updatePreview call here to avoid race conditions. 
        // It will be called on input or when script fully loads if content exists.
        setTimeout(() => { 
             if (typeof updatePreview === 'function' && htmlInput && htmlInput.value) updatePreview(); 
        }, 1000);

        // Helper to get 'from' safely (Priority: Hidden Input > SessionStorage)
        function getSafeFrom() {
             const hidden = document.getElementById('from_hidden');
             if (hidden && hidden.value && hidden.value.trim()) return hidden.value.trim();
             
             // Fallback to SessionStorage
             try {
                const data = JSON.parse(sessionStorage.getItem('emailData') || '{}');
                return data.from ? data.from.trim() : '';
             } catch(e) { return ''; }
        }

        form.onsubmit = async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');

            // Handle "Send New Email" state
            if (btn.dataset.state === 'success') {
                resetEditorForm();
                return;
            }

            btn.disabled = true;
            btn.textContent = translations[currentLang].sending;
            msgDiv.style.display = 'none';

            try {
                const finalAttachments = attachments.map(a => ({
                    filename: a.filename,
                    content: a.content
                }));
                
                // Replace image placeholders with actual base64 data before sending
                let contentToSend = htmlInput.value;
                Object.keys(insertedImages).forEach(imageId => {
                    const regex = new RegExp(\`!\\\\[\u56fe\u7247: ([^\\\\]]+)\\\\]\\\\(#\${imageId}\\\\)\`, 'g');
                    contentToSend = contentToSend.replace(regex, (match, filename) => {
                        return \`![\${filename}](\${insertedImages[imageId]})\`;
                    });
                });

                const res = await fetch('/api/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: getSafeFrom(),
                        to: document.getElementById('to').value,
                        subject: document.getElementById('subject').value,
                        password: document.getElementById('password_hidden').value,
                        html: contentToSend,
                        isMarkdown: isMd,
                        attachments: finalAttachments
                    })
                });
                const data = await res.json();
                
                if (res.ok) {
                    msgDiv.className = 'message success';
                    msgDiv.textContent = translations[currentLang].success;
                    
                    // Update button to success state
                    btn.textContent = translations[currentLang].success;
                    btn.disabled = false;
                    btn.dataset.state = 'success';
                    // Use theme color instead of green
                    btn.style.backgroundColor = 'var(--bg-card)'; 
                    btn.style.border = '1px solid var(--accent)';
                    btn.style.color = 'var(--accent)';
                    
                    // Change to "Send New" after delay
                    setTimeout(() => {
                        if (btn.dataset.state === 'success') {
                            btn.textContent = translations[currentLang].sendNew;
                            // Also hide message when switching to "Send New"
                            msgDiv.style.display = 'none';
                        }
                    }, 1000);

                    // Auto hide success message (Removed separate timeout)
                    /* 
                    setTimeout(() => {
                        if (btn.dataset.state === 'success') {
                           msgDiv.style.display = 'none';
                        }
                    }, 1000); 
                    */

                } else {
                    throw new Error(data.error || translations[currentLang].fail);
                    // Handle error state in catch
                }
            } catch (err) {
                msgDiv.className = 'message error';
                msgDiv.textContent = err.message;
                // Revert button
                btn.disabled = false;
                btn.textContent = translations[currentLang].sendBtn;
                btn.style.backgroundColor = ''; 
            } finally {
                msgDiv.style.display = 'block';
                // Do NOT reset button if success, wait for user action
                if (!btn.dataset.state) {
                     btn.disabled = false;
                     // btn.textContent set in catch or stays "Sending..." if logic flawed, but here we cover it
                }
            }
        };

        function resetEditorForm() {
            // Clear inputs
            const toInput = document.getElementById('to');
            const subjectInput = document.getElementById('subject');
            if (toInput) {
                toInput.value = '';
                updateSessionData('to', '');
            } 
            if (subjectInput) {
                subjectInput.value = '';
                updateSessionData('subject', '');
            } 
            
            if (htmlInput) htmlInput.value = '';
            
            // Clear attachments
            attachments = [];
            renderAttachments();
            
            // Clear inserted images
            insertedImages = {};
            
            // Reset Preview
            updatePreview();
            triggerAutoResize();
            
            // Reset Button
            const btn = form.querySelector('button[type="submit"]');
            btn.textContent = translations[currentLang].sendBtn;
            btn.dataset.state = '';
            btn.style.backgroundColor = '';
            btn.style.border = 'none';
            btn.style.color = 'white';
            
            // Hide message
            msgDiv.style.display = 'none';
        }

        // UI Logic: Preview Toggle & Responsive Handling
        const previewCol = document.querySelector('.col-preview');
        const toggleBtn = document.getElementById('togglePreview');
        const mobilePreview = document.getElementById('mobilePreview');
        let isMobilePreviewOpen = false;

        function handleResize() {
            const isMobile = window.innerWidth <= 1024;
            
            if (isMobile) {
                // Mobile Mode
                if (previewCol) previewCol.style.display = 'none'; // Ensure desktop col is hidden
                
                if (toggleBtn) {
                    toggleBtn.style.display = 'block';
                    toggleBtn.textContent = isMobilePreviewOpen ? '隐藏预览' : '显示预览';
                }

                if (mobilePreview) {
                    mobilePreview.style.display = isMobilePreviewOpen ? 'block' : 'none';
                }
            } else {
                // Desktop Mode
                if (previewCol) previewCol.style.display = 'flex'; // Show desktop col
                if (toggleBtn) toggleBtn.style.display = 'none'; // Hide toggle btn
                if (mobilePreview) mobilePreview.style.display = 'none'; // Hide mobile preview
            }
        }

        if (toggleBtn) {
            toggleBtn.onclick = function() {
                isMobilePreviewOpen = !isMobilePreviewOpen;
                handleResize(); // Re-apply state
            };
        }

        // Init & Event Listeners
        function initRouter() {
            const path = window.location.pathname;
            const infoPage = document.getElementById('infoPage');
            const emailForm = document.getElementById('emailForm');

            if (path === '/editor') {
                // 编辑器页面逻辑
                const dataStr = sessionStorage.getItem('emailData');
                if (!dataStr) {
                    alert('请先填写邮件信息');
                    window.location.href = '/';
                    return;
                }

                try {
                    const data = JSON.parse(dataStr);
                    
                    // 1. 本地强校验：必须包含密码且不为空
                    if (!data.password || !data.password.trim()) {
                         alert('未检测到有效的访问密码，请重新登录');
                         sessionStorage.removeItem('emailData'); // 清除无效数据
                         window.location.href = '/';
                         return;
                    }

                    // 2. 界面渲染逻辑 (先隐藏 infoPage，避免闪烁，但等待验证)
                    if (infoPage) infoPage.style.display = 'none';
                    if (emailForm) emailForm.style.display = 'none'; // 先都隐藏，或者加个 loading

                    // 3. 服务端即时验证 (防止使用旧密码缓存进入)
                    fetch('/api/verify', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ password: data.password })
                    })
                    .then(res => res.json())
                    .then(verifyData => {
                        if (verifyData.success) {
                            // 验证成功，显示编辑器
                            if (emailForm) emailForm.style.display = ''; 
                            // 填充表单数据
                             setTimeout(() => {
                                const f = document.getElementById('from_hidden');
                                if (f) {
                                    f.value = data.from;
                                    // document.getElementById('to_hidden').value = data.to; // 移至显式输入
                                    document.getElementById('password_hidden').value = data.password;
                                }
                                // 填充显示的主题和收件人输入框
                                const s = document.getElementById('subject'); 
                                if (s && data.subject) s.value = data.subject;
                                const t = document.getElementById('to');
                                if (t && data.to) t.value = data.to;
                             }, 0);
                        } else {
                            // 验证失败
                            alert(verifyData.error || '访问密码验证失败或已过期，请重新登录');
                            sessionStorage.removeItem('emailData');
                            window.location.href = '/';
                        }
                    })
                    .catch((e) => {
                        console.error('Verify error', e);
                        alert('无法验证访问状态，请检查网络');
                        window.location.href = '/';
                    });

                } catch (e) {
                    console.error('Data parse error', e);
                    window.location.href = '/';
                }
            } else {
                // 默认首页逻辑
                if (infoPage) infoPage.style.display = ''; // Show
                if (emailForm) emailForm.style.display = 'none';
                
                // 可选：如果 session 还有数据，回填到输入框，方便用户修改
                const dataStr = sessionStorage.getItem('emailData');
                if (dataStr) {
                    try {
                        const data = JSON.parse(dataStr);
                        document.getElementById('from').value = data.from || '';
                        // document.getElementById('to').value = data.to || '';  // To moved to editor
                        document.getElementById('password').value = data.password || '';
                    } catch(e) {}
                }
            }
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('DOMContentLoaded', () => {
            handleResize();
            initRouter();
        });
        
        // Update content on input
        if (htmlInput) { 
             htmlInput.removeEventListener('input', updatePreview); // Remove potential duplicates
             htmlInput.addEventListener('input', updatePreview);
        }
        
        // 辅助函数：更新 SessionStorage
        function updateSessionData(key, value) {
             const data = JSON.parse(sessionStorage.getItem('emailData') || '{}');
             data[key] = value;
             sessionStorage.setItem('emailData', JSON.stringify(data));
        }
        
        // Helper to reset button state on edit
        function resetButtonOnEdit() {
            const btn = form.querySelector('button[type="submit"]');
            if (btn && btn.dataset.state === 'success') {
                btn.textContent = translations[currentLang].sendBtn;
                btn.dataset.state = '';
                btn.style.backgroundColor = '';
                btn.style.border = 'none';
                btn.style.color = 'white';
                if (msgDiv) msgDiv.style.display = 'none';
            }
        }

        // 主题 & 收件人输入状态保存
        const subjectInput = document.getElementById('subject');
        if (subjectInput) {
            subjectInput.addEventListener('input', function() { 
                updateSessionData('subject', this.value); 
                resetButtonOnEdit();
            });
        }
        const toInput = document.getElementById('to');
        if (toInput) {
            toInput.addEventListener('input', function() { 
                updateSessionData('to', this.value); 
                resetButtonOnEdit();
            });
        }
        
        // Removed mode switching listeners

        // 信息填写页逻辑
        const toEditorBtn = document.getElementById('toEditorBtn');
        const passwordInput = document.getElementById('password');
        
        // 提取验证逻辑为函数，供按钮点击和回车键使用
        const handleLogin = async function() {
            // 校验
            const fromEl = document.getElementById('from');
            const passwordEl = document.getElementById('password');
            
            if (!fromEl || !passwordEl) {
                alert('找不到输入框');
                return;
            }

            const from = fromEl.value.trim();
            const password = passwordEl.value.trim();

            if (!from || !password) {
                alert('请填写完整邮件信息（包括访问密码）');
                return;
            }
            
            // 验证密码
            const btn = toEditorBtn;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '验证中...';
            
            try {
                // 设置超时控制 (10秒)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await fetch('/api/verify', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ password }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                const data = await res.json();
                
                if (!res.ok || !data.success) {
                    throw new Error(data.error || '访问密码错误');
                }
                
                // 保存数据到 SessionStorage 并跳转
                const oldData = JSON.parse(sessionStorage.getItem('emailData') || '{}');
                const emailData = { 
                    from, 
                    password,
                    to: oldData.to || '', 
                    subject: oldData.subject || '',
                };
                sessionStorage.setItem('emailData', JSON.stringify(emailData));
                
                // 强制跳转
                window.location.href = '/editor';
                
            } catch(e) {
                console.error('验证过程出错:', e);
                let msg = e.message;
                if (e.name === 'AbortError') msg = '验证超时，请检查网络连接';
                if (msg === 'Failed to fetch') msg = '无法连接到服务器，请检查网络';
                
                alert(msg || '验证失败');
                btn.disabled = false;
                btn.textContent = originalText;
            }
        };
        
        if (toEditorBtn) {
            toEditorBtn.onclick = handleLogin;
        } else {
            console.error('Login button not found');
        }
        
        // 密码输入框回车键监听
        if (passwordInput) {
            passwordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    handleLogin();
                }
            });
        }

        // 在form中添加隐藏input用于传递信息
        (function addHiddenInputs() {
            const form = document.getElementById('emailForm');
            if (form && !document.getElementById('from_hidden')) {
                const f = document.createElement('input');
                f.type = 'hidden'; f.id = 'from_hidden'; f.name = 'from';
                // const t = document.createElement('input');
                // t.type = 'hidden'; t.id = 'to_hidden'; t.name = 'to';
                const p = document.createElement('input');
                p.type = 'hidden'; p.id = 'password_hidden'; p.name = 'password';
                form.appendChild(f); form.appendChild(p);
            }
        })();

    </script>
</body>
</html>`;

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Helper to parse cookies
        const getCookie = (name) => {
            const cookies = request.headers.get('Cookie');
            if (!cookies) return null;
            const match = cookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
            if (match) return match[2];
            return null;
        };

        const correctPassword = (env.AUTH_PASSWORD || env.PASSWORD || '').trim();

        // 首页或登录页
        if (url.pathname === '/' || url.pathname === '/index.html') {
            return new Response(html, {
                headers: { 'Content-Type': 'text/html;charset=UTF-8' }
            });
        }

        // 编辑器页面 - 增加 Server-Side 验证
        if (url.pathname === '/editor') {
            const authCookie = getCookie('auth_token');
            // 简单的 Token 验证 (实际生产应使用更安全的 Hash/JWT)
            if (!authCookie || authCookie !== correctPassword) {
                return Response.redirect(url.origin, 302);
            }
            return new Response(html, {
                headers: { 'Content-Type': 'text/html;charset=UTF-8' }
            });
        }

        if (url.pathname === '/api/verify' && request.method === 'POST') {
            try {
                const body = await request.json();
                const password = (body.password || '').trim();

                // Debug: 打印当前环境对象中的所有 Key，帮助排查变量名问题
                const envKeys = Object.keys(env);
                console.log(`[Debug] Available Env Keys: ${JSON.stringify(envKeys)}`);

                // 安全策略：如果没有配置服务端密码，视为配置错误
                if (!correctPassword) {
                    // 将可用的变量名返回给前端（仅变量名，不含值），方便直接在报错中看到
                    const safeKeys = envKeys.join(', ');
                    return new Response(JSON.stringify({
                        success: false,
                        error: `服务端未读取到密码变量。当前检测到的变量名有: [${safeKeys}]。请检查 Cloudflare 后台变量名是否为 AUTH_PASSWORD，并尝试重新部署。`
                    }), {
                        status: 500, // 500 表示配置问题
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // 密码验证
                if (password !== correctPassword) {
                    return new Response(JSON.stringify({ success: false, error: '访问密码错误' }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // 验证成功，设置 Cookie so server knows we are auth
                // HttpOnly 不设置，因为我们只是用来做简单的路由守卫，且没有敏感数据在 Cookie 中 (password is sensitive though)
                // Let's use HttpOnly for better security
                // Wait, if I use HttpOnly, client JS can't read it. Worker can. This is good.
                const headers = new Headers();
                headers.set('Content-Type', 'application/json');
                // Set cookie valid for 7 days
                headers.append('Set-Cookie', `auth_token=${correctPassword}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

                return new Response(JSON.stringify({ success: true }), {
                    headers: headers
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 处理 API：直接调用 Resend API（不使用 SDK）
        if (url.pathname === '/api/send' && request.method === 'POST') {
            try {
                const { from, to, subject, password, html, isMarkdown, attachments } = await request.json();

                // 密码验证 (同步 Fail Closed 策略)
                const correctPassword = (env.AUTH_PASSWORD || env.PASSWORD || '').trim();
                if (!correctPassword) {
                    throw new Error('服务端未配置 AUTH_PASSWORD');
                }
                if ((password || '').trim() !== correctPassword) {
                    throw new Error('访问密码错误');
                }

                if (!env.RESEND_API_KEY) {
                    throw new Error('未配置 RESEND_API_KEY 环境变量');
                }

                // Markdown 转 HTML（简易版，前端已处理，这里直接使用）
                let content = html;
                if (isMarkdown) {
                    // 由于我们不使用 npm 依赖，这里简化：让前端处理 Markdown
                    // 或者使用简单的 markdown 转换（这里为了完全独立，直接传递）
                    content = html; // 前端会发送原始 markdown，我们需要转换

                    // 简易 Markdown 转换（仅支持基本语法）
                    content = content
                        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^- (.*$)/gim, '<li>$1</li>')
                        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                        .replace(/\n/g, '<br>');
                }

                // 直接调用 Resend API
                const cleanFrom = (from || '').replace(/"/g, '').trim();
                const payload = {
                    from: cleanFrom ? `"${cleanFrom}" <keao@kayro.top>` : `keao <keao@kayro.top>`,
                    to: [to],
                    subject: subject,
                    html: content
                };

                // Add attachments
                if (attachments && Array.isArray(attachments) && attachments.length > 0) {
                    payload.attachments = attachments;
                }

                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || '发送失败');
                }

                return new Response(JSON.stringify({ success: true, data }), {
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response('Not Found', { status: 404 });
    }
};
