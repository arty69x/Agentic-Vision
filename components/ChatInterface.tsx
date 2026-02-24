
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from "react";
import { sendMessageStream } from "../services/gemini";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInput } from "./ChatInput";
import { Sparkles, Lightbulb, ArrowLeft, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Part, Content } from "@google/genai";
import { ChatMessage, ExamplePrompt } from "../types";

const DEFAULT_EXAMPLES: ExamplePrompt[] = [
  {
    title: "Vision to Tailwind",
    prompt: "Convert this UI design into a pixel-perfect, responsive React component using Tailwind CSS. Analyze the blueprint/layout with perfect detail. Extract colors, typography, spacing, and structural hierarchy.",
    image: "https://picsum.photos/seed/dashboard/800/600"
  },
  {
    title: "Visual Thoughts",
    prompt: "Crop out all the animals, and use them as icons in a matplotlib plot showing the lifespan of those animals. Sort by lifespan.",
    image: "https://raw.githubusercontent.com/nannanxia-art/gemini-thinking/refs/heads/main/animals.jpg"
  },
  {
    title: "Visual Thoughts",
    prompt: "Analyze where the mug, glass, and bowl will go? Annotate them on the image with boxes and arrows and save the image.",
    image: "https://raw.githubusercontent.com/nannanxia-art/gemini-thinking/refs/heads/main/spatial2_min.jpeg"
  }
];

interface ExampleCardProps {
  example: ExamplePrompt;
  onClick: () => void;
}

const ExampleCard: React.FC<ExampleCardProps> = ({ example, onClick }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        const response = await fetch(example.image);
        if (!response.ok) throw new Error("Failed to load image");
        
        const blob = await response.blob();
        
        // Fix for mime type if application/octet-stream
        let mimeType = blob.type;
        if (!mimeType || mimeType === 'application/octet-stream') {
          const ext = example.image.split('.').pop()?.toLowerCase();
          if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
          else if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'webp') mimeType = 'image/webp';
          else if (ext === 'heic') mimeType = 'image/heic';
          else mimeType = 'image/jpeg';
        }

        // Create blob with correct type
        const finalBlob = blob.slice(0, blob.size, mimeType);
        objectUrl = URL.createObjectURL(finalBlob);
        
        if (isMounted) {
          setImageSrc(objectUrl);
        }
      } catch (err) {
        console.error("Thumbnail load error:", err);
        if (isMounted) setError(true);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [example.image]);

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-start p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left group"
    >
      <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100 relative">
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <Sparkles size={32} />
        </div>
        {imageSrc && !error && (
          <img
            src={imageSrc}
            alt={example.title}
            className="w-full h-full object-cover relative durable-image z-10 group-hover:scale-105 transition-transform duration-500"
            onError={() => setError(true)}
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-blue-600 font-medium mb-1">
        <Lightbulb size={16} />
        <span className="text-sm">{example.title}</span>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2">{example.prompt}</p>
    </motion.button>
  );
};

// Helper function to escape HTML special characters
function escapeHtml(unsafe: string) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Function to generate standalone HTML from messages
const generateHtmlFromMessages = (messages: ChatMessage[]) => {
  // Define icons inline for the export
  const icons = {
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    model: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>`,
    brain: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.97-1.375"/><path d="M17.97 16.625A4 4 0 0 1 16 18"/></svg>`,
    code: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`,
    terminal: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
    chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>`
  };

  const createCollapsible = (title: string, icon: string, content: string, headerClass: string, contentClass: string, status?: string) => {
    const isOk = status === "OUTCOME_OK";
    const badgeHtml = status ? `
        <span class="ml-auto text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${isOk ? "bg-emerald-500/20 text-emerald-600" : "bg-red-500/20 text-red-600"}">
            ${isOk ? "Success" : "Error"}
        </span>` : '';

    return `
      <div class="my-2 rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white group">
        <button onclick="toggleCollapse(this)" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${headerClass}">
          <div class="arrow-icon transition-transform duration-200" style="opacity: 0.5">${icons.chevron}</div>
          ${icon}
          <span class="flex-1">${title}</span>
          ${badgeHtml}
        </button>
        <div class="collapsible-content ${contentClass}">
          ${content}
        </div>
      </div>
    `;
  };

  const messagesHtml = messages.map(msg => {
    const isUser = msg.role === 'user';
    const roleColor = isUser ? 'bg-blue-600' : 'bg-emerald-600';
    const align = isUser ? 'flex-row-reverse' : 'flex-row';
    const bubbleStyle = isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 rounded-tl-sm text-gray-800';
    
    const partsHtml = msg.parts.map(part => {
      // @ts-ignore
      if (part.thought) {
        // @ts-ignore
        const thoughtText = typeof part.thought === 'string' ? part.thought : part.text;
        if (!thoughtText) return '';
        const content = `
           <div class="markdown-wrapper">
             <div class="markdown-source hidden">${escapeHtml(thoughtText)}</div>
             <div class="markdown-rendered prose prose-sm max-w-none prose-purple"></div>
           </div>
        `;
        return createCollapsible("Thought Process", icons.brain, content, "bg-purple-50 text-purple-700 hover:bg-purple-100", "p-3 bg-purple-50/50 text-purple-800");
      }
      
      if (part.executableCode) {
        const content = `
            <div class="p-3 bg-[#1e1e1e] overflow-x-auto">
              <pre class="text-xs text-white font-mono m-0"><code>${escapeHtml(part.executableCode.code)}</code></pre>
            </div>
        `;
        return createCollapsible(`Executable Code (${part.executableCode.language})`, icons.code, content, "bg-blue-50 text-blue-700 hover:bg-blue-100", "p-0 bg-[#1e1e1e]");
      }

      if (part.codeExecutionResult) {
        const isSuccess = part.codeExecutionResult.outcome === "OUTCOME_OK";
        const headerClass = isSuccess ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-700 hover:bg-red-100";
        const content = `<div class="whitespace-pre-wrap">${escapeHtml(part.codeExecutionResult.output)}</div>`;
        return createCollapsible("Execution Result", icons.terminal, content, headerClass, "p-3 bg-gray-50 text-gray-800 font-mono text-xs overflow-x-auto", part.codeExecutionResult.outcome);
      }

      if (part.inlineData) {
        return `<div class="my-2"><img src="data:${part.inlineData.mimeType};base64,${part.inlineData.data}" class="max-w-full rounded-lg border border-gray-200" /></div>`;
      }

      if (part.text) {
        return `
          <div class="markdown-wrapper">
             <div class="markdown-source hidden">${escapeHtml(part.text)}</div>
             <div class="markdown-rendered prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}"></div>
          </div>
        `;
      }
      return '';
    }).join('');

    return `
      <div class="flex gap-4 ${align} mb-6">
        <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${roleColor}">
          ${isUser ? icons.user : icons.model}
        </div>
        <div class="max-w-[85%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}">
          <div class="px-4 py-3 rounded-2xl shadow-sm overflow-hidden ${bubbleStyle}">
            ${partsHtml}
          </div>
          <div class="text-xs text-gray-400 px-1">
            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini Chat Export</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; }
      
      .collapsible-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
      }
      .collapsible-content.open {
          /* max-height handled by JS */
      }
      
      /* Custom scrollbar for styling parity */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    </style>
</head>
<body class="bg-gray-50 min-h-screen p-4 md:p-8">
    <div class="max-w-3xl mx-auto bg-white min-h-[80vh] rounded-3xl shadow-xl p-6 md:p-10">
        <div class="flex items-center gap-3 mb-10 pb-6 border-b border-gray-100">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                ${icons.sparkles}
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Gemini Chat Export</h1>
                <p class="text-sm text-gray-500">${new Date().toLocaleString()}</p>
            </div>
        </div>
        
        <div class="space-y-6">
            ${messagesHtml}
        </div>
    </div>
    <script>
      marked.use({
        breaks: true,
        gfm: true
      });
      
      function toggleCollapse(btn) {
          const content = btn.nextElementSibling;
          const arrow = btn.querySelector('.arrow-icon');
          
          if (content.style.maxHeight) {
              content.style.maxHeight = null;
              content.classList.remove('open');
              arrow.style.transform = 'rotate(0deg)';
          } else {
              content.classList.add('open');
              content.style.maxHeight = content.scrollHeight + "px";
              arrow.style.transform = 'rotate(90deg)';
          }
      }
      
      document.addEventListener('DOMContentLoaded', () => {
        const wrappers = document.querySelectorAll('.markdown-wrapper');
        wrappers.forEach(wrapper => {
          const source = wrapper.querySelector('.markdown-source');
          const target = wrapper.querySelector('.markdown-rendered');
          if (source && target) {
            target.innerHTML = marked.parse(source.innerText);
          }
        });
      });
    </script>
</body>
</html>`;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [examples, setExamples] = useState<ExamplePrompt[]>(DEFAULT_EXAMPLES);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch("/examples/prompts.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch examples");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setExamples(data);
        }
      })
      .catch((err) => console.log("Using default examples due to load error:", err));
  }, []);

  const handleExampleClick = async (example: ExamplePrompt) => {
    try {
      const response = await fetch(example.image);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Fix for mime type if application/octet-stream
      let mimeType = blob.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        const ext = example.image.split('.').pop()?.toLowerCase();
        if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'heic') mimeType = 'image/heic';
        else mimeType = 'image/jpeg';
      }

      // Create a new blob with the correct type
      const finalBlob = blob.slice(0, blob.size, mimeType);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        handleSendMessage(example.prompt, base64data);
      };
      reader.readAsDataURL(finalBlob);
    } catch (error) {
      console.error("Error loading example image:", error);
      // Fallback: Send message without image
      handleSendMessage(example.prompt);
    }
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    
    const htmlContent = generateHtmlFromMessages(messages);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-chat-export-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (text: string, image?: string) => {
    setIsLoading(true);
    
    // Construct user message parts
    const userParts: Part[] = [];
    if (text) {
      userParts.push({ text });
    }
    if (image) {
      const match = image.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        userParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }
    if (userParts.length === 0) {
      userParts.push({ text: " " });
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: userParts,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Prepare history for the API
      const history: Content[] = messages.map((msg) => {
        const cleanParts = msg.parts.map(p => {
             // Create a clean part object for the API
             const part: Part = {};
             if (p.text !== undefined && p.text !== "") part.text = p.text;
             if (p.inlineData) part.inlineData = p.inlineData;
             if (p.functionCall) part.functionCall = p.functionCall;
             if (p.functionResponse) part.functionResponse = p.functionResponse;
             // @ts-ignore
             if (p.executableCode) part.executableCode = p.executableCode;
             // @ts-ignore
             if (p.codeExecutionResult) part.codeExecutionResult = p.codeExecutionResult;
             return part;
        }).filter(p => Object.keys(p).length > 0);
        
        return {
          role: msg.role,
          parts: cleanParts.length > 0 ? cleanParts : [{ text: " " }]
        };
      });

      const streamResult = await sendMessageStream(text, history, image);

      // Create a placeholder for the model response
      const modelMessageId = (Date.now() + 1).toString();
      const modelMessage: ChatMessage = {
        id: modelMessageId,
        role: "model",
        parts: [],
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMessage]);

      for await (const chunk of streamResult) {
        const newParts = chunk.candidates?.[0]?.content?.parts || [];
        
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.id !== modelMessageId) return prev;

          const currentParts = [...lastMsg.parts];

          for (const newPart of newParts) {
            const lastPartIndex = currentParts.length - 1;
            const lastPart = currentParts[lastPartIndex];

            // Helper to check if parts are mergeable
            const isMergeableText = (p1: Part, p2: Part) => {
                // @ts-ignore
                const p1Thought = !!p1.thought;
                // @ts-ignore
                const p2Thought = !!p2.thought;

                return p1.text !== undefined && p2.text !== undefined &&
                       !p1.executableCode && !p2.executableCode &&
                       !p1.codeExecutionResult && !p2.codeExecutionResult &&
                       !p1.inlineData && !p2.inlineData &&
                       p1Thought === p2Thought;
            };

            if (newPart.text) {
              if (lastPart && isMergeableText(lastPart, newPart)) {
                currentParts[lastPartIndex] = {
                  ...lastPart,
                  text: (lastPart.text || "") + newPart.text
                };
              } else {
                // @ts-ignore
                currentParts.push({ text: newPart.text, thought: newPart.thought });
              }
            }
            else if (newPart.executableCode) {
               if (lastPart && lastPart.executableCode && lastPart.executableCode.language === newPart.executableCode.language) {
                 currentParts[lastPartIndex] = {
                   ...lastPart,
                   executableCode: {
                     ...lastPart.executableCode,
                     code: (lastPart.executableCode.code || "") + newPart.executableCode.code
                   }
                 };
               } else {
                 currentParts.push({ executableCode: { ...newPart.executableCode } });
               }
            }
            else if (newPart.codeExecutionResult) {
               currentParts.push({ codeExecutionResult: { ...newPart.codeExecutionResult } });
            }
            else if (newPart.inlineData) {
               currentParts.push({ inlineData: { ...newPart.inlineData } });
            }
            // @ts-ignore
            else if (newPart.thought) {
               // @ts-ignore
               currentParts.push({ thought: newPart.thought, text: newPart.text || "" });
            }
          }

          return [...prev.slice(0, -1), { ...lastMsg, parts: currentParts }];
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: "model",
        parts: [{ text: "Sorry, I encountered an error. Please try again." }],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setMessages([]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm transition-all">
        {messages.length > 0 ? (
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-1"
            title="Back to Start"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles size={24} />
          </div>
        )}
        
        <div>
          <h1 className="font-bold text-xl text-gray-800">Gemini Chat with Agentic Vision</h1>
          <p className="text-xs text-gray-500 font-medium">Gemini 3.1 Pro</p>
        </div>

        <div className="flex-1"></div>

        {messages.length > 0 && (
          <button 
            onClick={handleExport}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Export conversation"
          >
            <Download size={20} />
          </button>
        )}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-center mb-6 text-blue-500">
                <Sparkles size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Gemini Chat with Agentic Vision!</h2>
              <p className="text-gray-500 max-w-md mb-8">
                Try agentic vision with Gemini 3.1 Pro
              </p>

              {examples.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                  {examples.map((example, index) => (
                    <ExampleCard 
                      key={index} 
                      example={example} 
                      onClick={() => handleExampleClick(example)} 
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessageItem 
                key={msg.id} 
                message={msg} 
                isStreaming={isLoading && index === messages.length - 1}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          <p className="text-center text-xs text-gray-400 mt-3">
            Gemini may display inaccurate info, including about people, so double-check its responses. By using this feature, you confirm that you have the necessary rights to any content that you upload. Do not generate content that infringes on others’ intellectual property or privacy rights. Your use of this generative AI service is subject to our Prohibited Use Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
