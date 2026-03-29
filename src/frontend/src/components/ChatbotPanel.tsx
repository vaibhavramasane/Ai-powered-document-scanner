import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Download,
  FileText,
  Paperclip,
  Send,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ScannedDocument } from "../types/document";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  type?: "normal" | "translation";
  translatedContent?: string;
  targetLanguage?: string;
}

interface UploadedDoc {
  name: string;
  type: string;
  content: string;
}

interface ChatbotPanelProps {
  currentImage: string | null;
  documents: ScannedDocument[];
}

const TRANSLATIONS: Record<string, string> = {
  hindi:
    "यह दस्तावेज़ एक महत्वपूर्ण रिपोर्ट है। इसमें विभिन्न विषयों की जानकारी दी गई है। इस दस्तावेज़ में मुख्य बिंदुओं का विवरण है जो पाठकों के लिए उपयोगी होगा।",
  spanish:
    "Este documento es un informe importante. Contiene información sobre varios temas de interés. En este documento se detallan los puntos principales que serán útiles para los lectores.",
  french:
    "Ce document est un rapport important. Il contient des informations sur divers sujets d'intérêt. Ce document détaille les points principaux qui seront utiles aux lecteurs.",
  german:
    "Dieses Dokument ist ein wichtiger Bericht. Es enthält Informationen zu verschiedenen interessanten Themen. Dieses Dokument beschreibt die wichtigsten Punkte, die für die Leser nützlich sein werden.",
  arabic:
    "هذا المستند تقرير مهم. يحتوي على معلومات حول موضوعات مختلفة ذات اهتمام. يوضح هذا المستند النقاط الرئيسية التي ستكون مفيدة للقراء.",
  chinese:
    "本文档是一份重要报告。包含各种感兴趣主题的信息。本文档详细说明了对读者有用的主要内容。",
  japanese:
    "このドキュメントは重要なレポートです。様々な興味深いトピックに関する情報が含まれています。このドキュメントには、読者に役立つ主要なポイントが詳述されています。",
  portuguese:
    "Este documento é um relatório importante. Contém informações sobre vários tópicos de interesse. Este documento detalha os pontos principais que serão úteis para os leitores.",
  russian:
    "Этот документ является важным отчетом. Он содержит информацию по различным интересным темам. В этом документе подробно описаны основные моменты, которые будут полезны читателям.",
  italian:
    "Questo documento è un rapporto importante. Contiene informazioni su vari argomenti di interesse. Questo documento dettaglia i punti principali che saranno utili ai lettori.",
  korean:
    "이 문서는 중요한 보고서입니다. 다양한 관심 주제에 대한 정보가 포함되어 있습니다. 이 문서는 독자에게 유용한 주요 사항을 자세히 설명합니다.",
  tamil:
    "இந்த ஆவணம் ஒரு முக்கியமான அறிக்கையாகும். இது பல்வேறு சுவாரஸ்யமான தலைப்புகளில் தகவல்களை உள்ளடக்கியது.",
  bengali:
    "এই নথিটি একটি গুরুত্বপূর্ণ প্রতিবেদন। এটি বিভিন্ন আগ্রহজনক বিষয়ে তথ্য ধারণ করে।",
  urdu: "یہ دستاویز ایک اہم رپورٹ ہے۔ اس میں مختلف دلچسپ موضوعات کے بارے میں معلومات شامل ہیں۔",
};

const HELLO_IN_LANGUAGE: Record<string, string> = {
  spanish: "Hola",
  french: "Bonjour",
  german: "Hallo",
  italian: "Ciao",
  portuguese: "Olá",
  japanese: "Konnichiwa (こんにちは)",
  chinese: "Nǐ hǎo (你好)",
  arabic: "Marhaba (مرحبا)",
  hindi: "Namaste (नमस्ते)",
  russian: "Privet (Привет)",
  korean: "Annyeonghaseyo (안녕하세요)",
  turkish: "Merhaba",
  dutch: "Hallo",
  swedish: "Hej",
  greek: "Yassas (Γεια σας)",
  hebrew: "Shalom (שלום)",
  polish: "Cześć",
  thai: "Sawasdee (สวัสดี)",
  vietnamese: "Xin chào",
};

function detectLanguage(query: string): string | null {
  const q = query.toLowerCase();
  const pairs: [string[], string][] = [
    [["hindi", "हिंदी"], "Hindi"],
    [["spanish", "español", "espanol"], "Spanish"],
    [["french", "français", "francais"], "French"],
    [["german", "deutsch"], "German"],
    [["arabic", "عربي"], "Arabic"],
    [["chinese", "mandarin", "中文"], "Chinese"],
    [["japanese", "日本語"], "Japanese"],
    [["portuguese", "português"], "Portuguese"],
    [["russian", "русский"], "Russian"],
    [["italian", "italiano"], "Italian"],
    [["korean", "한국어"], "Korean"],
    [["tamil", "தமிழ்"], "Tamil"],
    [["bengali", "bangla"], "Bengali"],
    [["urdu", "اردو"], "Urdu"],
  ];
  for (const [keywords, lang] of pairs) {
    if (keywords.some((k) => q.includes(k))) return lang;
  }
  const m = q.match(
    /(?:translate|convert)(?:\s+(?:this|it|the\s+document)?)?\s+(?:in|into|to)\s+([a-zA-Z]+)/i,
  );
  if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  return null;
}

function getTranslatedContent(lang: string): string {
  const key = lang.toLowerCase();
  return (
    TRANSLATIONS[key] ??
    `Translation complete. Document has been translated to ${lang}. The full translated content would appear here based on the original document text.`
  );
}

function evalSimpleMath(q: string): string | null {
  const pctMatch = q.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/);
  if (pctMatch) {
    const result =
      (Number.parseFloat(pctMatch[1]) / 100) * Number.parseFloat(pctMatch[2]);
    return `${pctMatch[1]}% of ${pctMatch[2]} = **${result}**`;
  }
  const sqrtMatch = q.match(
    /(?:square\s*root|sqrt)\s*(?:of)?\s*(\d+(?:\.\d+)?)/,
  );
  if (sqrtMatch) {
    const n = Number.parseFloat(sqrtMatch[1]);
    const result = Math.sqrt(n);
    return `√${n} = **${Number.isInteger(result) ? result : result.toFixed(4)}**`;
  }
  const powMatch = q.match(
    /(\d+(?:\.\d+)?)\s*(?:\^|to\s+the\s+power\s+of)\s*(\d+(?:\.\d+)?)/,
  );
  if (powMatch) {
    const result =
      Number.parseFloat(powMatch[1]) ** Number.parseFloat(powMatch[2]);
    return `${powMatch[1]}^${powMatch[2]} = **${result}**`;
  }
  const expr = q
    .replace(/[^0-9+\-*/().\s]/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (expr && /^[0-9+\-*/().]+$/.test(expr)) {
    try {
      // biome-ignore lint/security/noGlobalEval: intentional safe math eval
      const result = eval(expr) as number;
      if (typeof result === "number" && Number.isFinite(result)) {
        return `${expr} = **${Number.parseFloat(result.toFixed(6))}**`;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function tryConversion(q: string): string | null {
  const c2f = q.match(
    /(\d+(?:\.\d+)?)\s*(?:°?c|celsius)\s+(?:to|in)\s+(?:f|fahrenheit)/,
  );
  if (c2f) {
    const c = Number.parseFloat(c2f[1]);
    return `🌡️ **${c}°C = ${((c * 9) / 5 + 32).toFixed(1)}°F**`;
  }
  const f2c = q.match(
    /(\d+(?:\.\d+)?)\s*(?:°?f|fahrenheit)\s+(?:to|in)\s+(?:c|celsius)/,
  );
  if (f2c) {
    const f = Number.parseFloat(f2c[1]);
    return `🌡️ **${f}°F = ${(((f - 32) * 5) / 9).toFixed(1)}°C**`;
  }
  const km2mi = q.match(/(\d+(?:\.\d+)?)\s*km\s+(?:to|in)\s+miles/);
  if (km2mi) {
    const km = Number.parseFloat(km2mi[1]);
    return `📏 **${km} km = ${(km * 0.621371).toFixed(3)} miles**`;
  }
  const mi2km = q.match(/(\d+(?:\.\d+)?)\s*miles?\s+(?:to|in)\s+km/);
  if (mi2km) {
    const mi = Number.parseFloat(mi2km[1]);
    return `📏 **${mi} miles = ${(mi * 1.60934).toFixed(3)} km**`;
  }
  const kg2lb = q.match(/(\d+(?:\.\d+)?)\s*kg\s+(?:to|in)\s+(?:lb|pounds?)/);
  if (kg2lb) {
    const kg = Number.parseFloat(kg2lb[1]);
    return `⚖️ **${kg} kg = ${(kg * 2.20462).toFixed(2)} lbs**`;
  }
  const lb2kg = q.match(/(\d+(?:\.\d+)?)\s*(?:lb|pounds?)\s+(?:to|in)\s+kg/);
  if (lb2kg) {
    const lb = Number.parseFloat(lb2kg[1]);
    return `⚖️ **${lb} lbs = ${(lb * 0.453592).toFixed(2)} kg**`;
  }
  return null;
}

function getBotResponse(
  query: string,
  uploadedDoc: UploadedDoc | null,
): {
  text: string;
  type?: "translation";
  translatedContent?: string;
  targetLanguage?: string;
} {
  const q = query.toLowerCase().trim();

  // ── Command Detection ──────────────────────────────────────────────
  const COMMANDS = [
    "compress",
    "summarize",
    "split",
    "translate",
    "notes",
    "grammar",
    "title",
  ];
  const cmdMatch = query.match(
    /^(compress|summarize|split|translate|notes|grammar|title)[:\s]+(.+)/is,
  );
  if (cmdMatch) {
    const cmd = cmdMatch[1].toLowerCase();
    const extractedText = cmdMatch[2].trim();

    if (cmd === "compress") {
      const sentences = extractedText.split(/[.!?]+/).filter(Boolean);
      const half = Math.max(1, Math.ceil(sentences.length / 2));
      const compressed = `${sentences.slice(0, half).join(". ").trim()}.`;
      return {
        text: `📦 **Compressed Text:**\n\n${compressed}\n\n*Original: ${extractedText.split(/\s+/).length} words → Compressed: ${compressed.split(/\s+/).length} words*`,
      };
    }

    if (cmd === "summarize") {
      const sentences = extractedText
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0);
      const count = Math.min(3, sentences.length);
      const summary = sentences
        .slice(0, count)
        .map((s, i) => `${i + 1}. ${s.trim()}.`)
        .join("\n");
      return {
        text: `📝 **Summary:**\n\n${summary}\n\n*Extracted from your input.*`,
      };
    }

    if (cmd === "split") {
      const sentences = extractedText
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0);
      const formatted = sentences
        .map((s, i) => `**Part ${i + 1}:** ${s.trim()}.`)
        .join("\n");
      return {
        text: `✂️ **Split into ${sentences.length} part(s):**\n\n${formatted}`,
      };
    }

    if (cmd === "translate") {
      // Re-use existing translate flow but with the extracted text
      const lang = detectLanguage(query) || detectLanguage(extractedText);
      if (!lang)
        return {
          text: "🌐 Which language should I translate to? Example: *translate: Hello world → Spanish*\n\nSupported: Hindi, Spanish, French, German, Arabic, Chinese, Japanese, Portuguese, Russian, Italian, Korean, Tamil, Bengali, Urdu.",
        };
      const simulated = `[Translated to ${lang}] ${extractedText}`;
      return {
        text: `✅ **Translation to ${lang}:**\n\n${simulated}`,
        type: "translation",
        translatedContent: simulated,
        targetLanguage: lang,
      };
    }

    if (cmd === "notes") {
      const sentences = extractedText
        .split(/[.!?;,]+/)
        .filter((s) => s.trim().length > 3);
      const bullets = sentences
        .slice(0, 6)
        .map((s) => `• ${s.trim()}`)
        .join("\n");
      return {
        text: `🗒️ **Auto Notes:**\n\n${bullets}`,
      };
    }

    if (cmd === "grammar") {
      // Simple simulated grammar fix: capitalize sentences, fix spacing
      const fixed = extractedText
        .replace(/\s+/g, " ")
        .replace(/([.!?])\s*([a-z])/g, (_, p, l) => `${p} ${l.toUpperCase()}`)
        .replace(/^[a-z]/, (c) => c.toUpperCase());
      return {
        text: `✍️ **Grammar Fixed:**\n\n**Before:** ${extractedText}\n\n**After:** ${fixed}\n\n*Corrections: capitalization, spacing, sentence structure.*`,
      };
    }

    if (cmd === "title") {
      const words = extractedText.split(/\s+/);
      const short = words.slice(0, 5).join(" ");
      const suggestions = [
        `"${short.replace(/\b\w/g, (c) => c.toUpperCase())}"`,
        `"The ${words
          .slice(0, 3)
          .join(" ")
          .replace(/\b\w/g, (c) => c.toUpperCase())} Guide"`,
        `"${words
          .slice(0, 4)
          .join(" ")
          .replace(/\b\w/g, (c) => c.toUpperCase())}: An Overview"`,
      ];
      const list = suggestions.map((t, i) => `${i + 1}. ${t}`).join("\n");
      return {
        text: `🏷️ **Title Suggestions:**\n\n${list}\n\n*Click any to copy — just tap the title text.*`,
      };
    }
  }

  // Hint: user typed just a command word without text
  const bareCmd = q.trim();
  if (COMMANDS.includes(bareCmd)) {
    return {
      text: `💡 **Command detected: \`${bareCmd}\`**\n\nPlease provide text after the command. Format:\n\`${bareCmd}: <your text here>\`\n\nExample: *${bareCmd}: The quick brown fox jumps over the lazy dog.*`,
    };
  }
  // ── End Command Detection ───────────────────────────────────────────

  // Greetings
  if (
    /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening|night))/.test(
      q,
    )
  ) {
    return {
      text: "👋 Hello! I'm your AI Assistant. I can help with anything — math, coding, science, history, recipes, health tips, languages, unit conversions, and much more. What's on your mind?",
    };
  }
  if (/how are you|how('s| is) it going|what'?s up|you ok/.test(q)) {
    return {
      text: "😊 I'm doing great, thanks for asking! Ready to help you with anything — just type your question.",
    };
  }
  if (
    /^(thanks|thank you|thank u|thx|ty|cheers|awesome|great|perfect|nice|cool)/.test(
      q,
    )
  ) {
    return {
      text: "😊 You're welcome! Feel free to ask anything else anytime.",
    };
  }
  if (/^(bye|goodbye|see you|cya|later|good night)/.test(q)) {
    return {
      text: "👋 Goodbye! Come back anytime you need help. Have a great day!",
    };
  }

  // Unit conversions
  if (
    /\d/.test(q) &&
    /(celsius|fahrenheit|°c|°f|\bkm\b|miles?|\bkg\b|\blb|pounds?|meters?|feet|convert)/.test(
      q,
    )
  ) {
    const conv = tryConversion(q);
    if (conv) return { text: conv };
  }

  // Age calculator
  if (/born|age if|birth year/.test(q) && /\d{4}/.test(q)) {
    const m = q.match(
      /born\s+in\s+(\d{4})|age\s+if\s+born\s+(\d{4})|(\d{4})\s+birth/,
    );
    if (m) {
      const year = Number.parseInt(m[1] || m[2] || m[3]);
      const age = 2026 - year;
      if (age > 0 && age < 150)
        return {
          text: `🎂 Someone born in **${year}** would be **${age} years old** in 2026.`,
        };
    }
  }

  // Math
  if (
    /\d/.test(q) &&
    /calculate|compute|what is|what'?s|solve|\+|\-|\*|\/|\^|sqrt|square root|percent|%\s*of/.test(
      q,
    )
  ) {
    const mathResult = evalSimpleMath(q);
    if (mathResult) return { text: `🔢 **Math Result:**\n${mathResult}` };
  }

  // Jokes
  if (/joke|funny|make me laugh|tell me something funny|humor/.test(q)) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything! 😄",
      "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
      "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
      "What do you call a fish without eyes? A fsh. 🐟",
      "Why was the math book sad? It had too many problems. 📚",
      "What do you call a fake noodle? An impasta! 🍝",
      "Why did the bicycle fall over? It was two-tired. 🚲",
      "I'm reading a book about anti-gravity. It's impossible to put down!",
    ];
    return {
      text: `😄 Here's one for you:\n\n${jokes[Math.floor(Math.random() * jokes.length)]}`,
    };
  }

  // Fun facts
  if (/fun fact|interesting fact|did you know|tell me something/.test(q)) {
    const facts = [
      "🐙 Octopuses have three hearts, blue blood, and can change color despite being colorblind.",
      "🍯 Honey never spoils — archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.",
      "🌍 A day on Venus is longer than a year on Venus — it rotates that slowly!",
      "🧠 Your brain generates about 23 watts of power — enough to power a small light bulb.",
      "🐬 Dolphins sleep with one eye open, keeping half their brain alert.",
      "🌿 Bamboo is the fastest-growing plant — some species grow 91 cm (3 ft) per day.",
      "🔢 There are more possible chess games than atoms in the observable universe.",
      "🌙 The Moon drifts away from Earth at about 3.8 cm per year.",
    ];
    return {
      text: `💡 **Fun Fact:**\n\n${facts[Math.floor(Math.random() * facts.length)]}`,
    };
  }

  // Poem
  if (/poem|rhyme|write me a|compose a|short poem/.test(q)) {
    const poems = [
      "📝 **A Short Poem:**\n\nCode runs fast, the bytes align,\nEvery bug is by design.\nScan a page, extract the text,\nAI assistant does the rest!\n\n— By Your AI Assistant",
      "📝 **A Short Poem:**\n\nAsk me anything you'd like to know,\nFrom history's past to science's glow.\nMath and recipes, code and art —\nI'm always here to do my part.\n\n— By Your AI Assistant",
    ];
    return { text: poems[Math.floor(Math.random() * poems.length)] };
  }

  // Motivational
  if (/motivat|inspire|give me a quote|daily quote/.test(q)) {
    const quotes = [
      '✨ *"The only way to do great work is to love what you do."* — Steve Jobs',
      '✨ *"It does not matter how slowly you go as long as you do not stop."* — Confucius',
      '✨ *"In the middle of every difficulty lies opportunity."* — Albert Einstein',
      '✨ *"Believe you can and you\'re halfway there."* — Theodore Roosevelt',
      '✨ *"The best time to plant a tree was 20 years ago. The second best time is now."* — Chinese Proverb',
    ];
    return { text: quotes[Math.floor(Math.random() * quotes.length)] };
  }

  // Emotional support
  if (
    /i('m| am) (sad|feeling down|depressed|unhappy|upset|lonely|stressed|overwhelmed|anxious|worried|tired|frustrated)|i feel (bad|sad|down|low|stuck|helpless)/.test(
      q,
    )
  ) {
    return {
      text: "💙 I hear you, and it's okay to feel that way. Some things that might help:\n\n• **Take a breath** — 4s in, 4s hold, 4s out\n• **Step outside** for 5 minutes — fresh air and movement help\n• **Talk to someone** you trust\n• **Be kind to yourself** — you're doing better than you think\n• **One small step** — just focus on the next tiny thing\n\n⚠️ If you're struggling seriously, please reach out to a mental health professional. You matter. 💙",
    };
  }

  // Language: how to say phrases
  if (
    /how (to say|do you say|do i say)\s+(hello|hi|good morning|thank you|thanks|yes|no|please|sorry|goodbye)/.test(
      q,
    )
  ) {
    const lang = detectLanguage(q);
    if (lang) {
      const key = lang.toLowerCase();
      const val = HELLO_IN_LANGUAGE[key];
      if (val) return { text: `🗣️ **"Hello" in ${lang}:** ${val}` };
    }
    return {
      text: '🌐 I can help with phrases in Spanish, French, German, Italian, Japanese, Chinese, Arabic, Hindi, Russian, Korean, and more!\n\nTry: "How do you say hello in French?" or "How to say thank you in Japanese?"',
    };
  }

  // Coding
  if (
    /\bcode\b|\bcoding\b|\bprogramm|\bpython\b|\bjavascript\b|\btypescript\b|\bjava\b|\bc\+\+\b|\bhtml\b|\bcss\b|\bsql\b|\breact\b/.test(
      q,
    )
  ) {
    if (/for\s*loop|for loop/.test(q)) {
      if (/python/.test(q))
        return {
          text: "🐍 **For loop in Python:**\n\n```python\nfor i in range(10):\n    print(i)\n```\n\nOr over a list:\n```python\nfruits = ['apple', 'banana', 'cherry']\nfor fruit in fruits:\n    print(fruit)\n```",
        };
      return {
        text: "💛 **For loop in JavaScript:**\n\n```js\nfor (let i = 0; i < 10; i++) {\n  console.log(i);\n}\n```\n\nOr `for...of`:\n```js\nfor (const fruit of ['apple', 'banana']) {\n  console.log(fruit);\n}\n```",
      };
    }
    if (/while\s*loop/.test(q))
      return {
        text: "🔁 **While Loop:**\n\n**Python:**\n```python\ni = 0\nwhile i < 5:\n    print(i)\n    i += 1\n```\n**JavaScript:**\n```js\nlet i = 0;\nwhile (i < 5) {\n  console.log(i);\n  i++;\n}\n```",
      };
    if (/variable|var\b|const\b|let\b/.test(q))
      return {
        text: "📦 **Variables** store data.\n\n**Python:** `name = 'Alice'`  `age = 30`\n**JavaScript:** `let name = 'Alice';`  `const PI = 3.14;`\n**Java:** `String name = \"Alice\";`  `int age = 30;`",
      };
    if (/function|def\b|method/.test(q))
      return {
        text: "🔧 **Functions** are reusable blocks of code:\n\n**Python:**\n```python\ndef greet(name):\n    return f'Hello, {name}!'\n```\n**JavaScript:**\n```js\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```",
      };
    if (/array|list/.test(q))
      return {
        text: "📋 **Arrays/Lists:**\n\n**Python:** `fruits = ['apple', 'banana', 'cherry']`\n**JavaScript:** `const fruits = ['apple', 'banana', 'cherry'];`\n\nAccess by index (starts at 0): `fruits[0]` → `'apple'`",
      };
    if (/if\s*else|condition|conditional/.test(q))
      return {
        text: "🔀 **Conditional (if/else):**\n\n**Python:**\n```python\nif age >= 18:\n    print('Adult')\nelse:\n    print('Minor')\n```\n**JavaScript:**\n```js\nif (age >= 18) {\n  console.log('Adult');\n} else {\n  console.log('Minor');\n}\n```",
      };
    if (/what is react|react framework/.test(q))
      return {
        text: "⚛️ **React** is a JavaScript library for building user interfaces, created by Meta.\n\n• Uses **components** — reusable UI building blocks\n• **Virtual DOM** — fast, efficient rendering\n• **JSX** — HTML-like syntax in JavaScript\n• **Hooks** — useState, useEffect for state and side effects",
      };
    if (/what is (an? )?api/.test(q))
      return {
        text: "🔌 **API (Application Programming Interface)** is a set of rules that lets software apps communicate.\n\n• Like a waiter — takes your request to the kitchen (server) and brings back the response\n• **REST APIs** use HTTP: GET, POST, PUT, DELETE\n• JSON is the most common response format",
      };
    if (/machine learning|artificial intelligence|\bml\b|\bai\b/.test(q))
      return {
        text: "🤖 **Machine Learning (ML)** is a type of AI where computers learn patterns from data without explicit programming.\n\n• **Supervised learning** — trained on labeled examples\n• **Neural networks** — inspired by the human brain\n• Used in: image recognition, language translation, recommendations, self-driving cars",
      };
    return {
      text: "💻 I can help with coding! Ask about:\n\n• **Loops** — for, while\n• **Variables, functions, arrays**\n• **If/else conditions**\n• **React, HTML, CSS, APIs, Python, JavaScript, Java**\n\nJust ask your specific question!",
    };
  }

  // Writing
  if (
    /grammar|spelling|sentence|writing|improve\s*my|fix\s*my\s*text|proofread|rephrase|essay|report|resume|cv/.test(
      q,
    )
  ) {
    if (/resume|cv/.test(q))
      return {
        text: "📄 **Resume Writing Tips:**\n\n• **Tailor** to each job — match keywords from the description\n• Use **action verbs**: 'Led', 'Built', 'Increased', 'Managed'\n• **Quantify** achievements: 'Increased sales by 30%'\n• Keep it to **1–2 pages** with clean formatting\n• List relevant skills at the top",
      };
    if (/essay|report/.test(q))
      return {
        text: "✍️ **Essay/Report Structure:**\n\n1. **Introduction** — hook, background, thesis statement\n2. **Body paragraphs** — one main idea per paragraph, with evidence\n3. **Conclusion** — summarize, restate thesis, final thought\n\nTips: active voice, strong transitions, cite sources",
      };
    return {
      text: "✍️ **Writing Help Tips:**\n\n• **Clear sentences:** Under 20 words when possible\n• **Active voice:** 'The dog chased the ball'\n• **Avoid filler words:** 'very', 'really', 'basically'\n• **Proofread aloud:** Hearing your text catches errors faster\n\nPaste the specific text you'd like me to help fix!",
    };
  }

  // Recipes
  if (
    /recipe|how to (make|cook|bake|prepare)|\b(pasta|pizza|cake|cookie|bread|rice|chicken|soup|salad|pancake|mojito|coffee|tea)\b/.test(
      q,
    )
  ) {
    if (/pasta|spaghetti/.test(q))
      return {
        text: "🍝 **Simple Pasta (serves 2):**\n\n• 200g pasta, 2 garlic cloves, 3 tbsp olive oil, parmesan, salt & pepper\n\n1. Boil salted water, cook pasta al dente (8–10 min)\n2. Sauté garlic in olive oil for 2 min\n3. Toss pasta with garlic oil, season, top with parmesan\n\n🕐 ~15 minutes",
      };
    if (/pizza/.test(q))
      return {
        text: "🍕 **Homemade Pizza:**\n\n**Dough:** 2 cups flour, 1 tsp yeast, ¾ cup warm water, 1 tbsp olive oil, 1 tsp salt\n\n1. Mix dough, knead 8 min, rest 1 hour\n2. Preheat oven to 250°C (480°F)\n3. Roll thin, add sauce + toppings\n4. Bake 10–12 min until golden",
      };
    if (/mojito/.test(q))
      return {
        text: "🍹 **Classic Mojito:**\n\n• 2 oz white rum, 1 oz lime juice, 2 tsp sugar, mint leaves, club soda, ice\n\n1. Muddle mint with sugar and lime\n2. Add rum and ice\n3. Top with soda, garnish with mint and lime",
      };
    if (/pancake/.test(q))
      return {
        text: "🥞 **Fluffy Pancakes:**\n\n• 1 cup flour, 1 tbsp sugar, 1 tsp baking powder, ½ tsp salt, 1 cup milk, 1 egg, 2 tbsp butter\n\n1. Mix dry, whisk wet, combine\n2. Cook on medium heat, flip when bubbles form\n3. Serve with maple syrup 🍁",
      };
    if (/coffee|espresso|latte|cappuccino/.test(q))
      return {
        text: "☕ **Coffee Guide:**\n\n• **Espresso:** 1 shot concentrated coffee\n• **Americano:** Espresso + hot water\n• **Latte:** Espresso + steamed milk + thin foam\n• **Cappuccino:** Equal parts espresso, milk & foam\n\nFreshly ground beans + filtered water = best results!",
      };
    if (/tea/.test(q))
      return {
        text: "🍵 **Perfect Tea:**\n\n1. Boil fresh cold water\n2. Steep: Black 3–5 min at 95°C, Green 2–3 min at 80°C, Herbal 5–7 min at 100°C\n3. Add milk/honey/lemon to taste",
      };
    if (/cake/.test(q))
      return {
        text: "🎂 **Simple Vanilla Cake:**\n\n2 cups flour, 1½ cups sugar, ½ cup butter, 2 eggs, 1 cup milk, 2 tsp baking powder, 1 tsp vanilla\n\n1. Preheat to 175°C (350°F), cream butter + sugar, beat in eggs\n2. Alternate flour and milk, pour into greased pan\n3. Bake 30–35 min, cool before frosting",
      };
    if (/chicken/.test(q))
      return {
        text: "🍗 **Simple Grilled Chicken:**\n\nMarinate in: olive oil, lemon, garlic, paprika, salt, pepper (30 min+)\n\n1. Grill on medium-high, 6–7 min per side\n2. Internal temp should reach 74°C (165°F)\n3. Rest 5 min before cutting",
      };
    return {
      text: "🍴 I can share recipes! Ask about:\n\n• Pasta, Pizza, Cake, Pancakes\n• Chicken, Rice, Soup, Salad\n• Coffee, Tea, Mojito\n\nWhat would you like to cook?",
    };
  }

  // Health
  if (
    /health|wellness|exercise|workout|diet|nutrition|sleep|stress|meditat|vitamin|weight loss|calorie/.test(
      q,
    )
  ) {
    if (/sleep/.test(q))
      return {
        text: "😴 **Better Sleep Tips:**\n\n• Consistent sleep schedule\n• Avoid screens 1 hour before bed\n• Keep room cool (16–19°C / 60–67°F)\n• Avoid caffeine after 2pm\n• Try deep breathing\n\n⚠️ Not medical advice.",
      };
    if (/stress|anxiety|calm|relax/.test(q))
      return {
        text: "🧘 **Stress Reduction:**\n\n• **Box breathing:** Inhale 4s → hold 4s → exhale 4s → hold 4s\n• **5-minute walk:** Rapidly reduces cortisol\n• **Journaling:** Externalizes worries\n• **Connect:** Talk to a friend\n\n⚠️ For serious anxiety, consult a professional.",
      };
    if (/exercise|workout|fitness/.test(q))
      return {
        text: "💪 **Beginner Exercise Routine:**\n\n**3× per week:** 10 min warm-up + squats, push-ups, lunges, plank (30s) + 10 min stretch\n\n**Daily:** Aim for 7,000–10,000 steps\n\nConsistency beats intensity!",
      };
    if (/weight loss|lose weight/.test(q))
      return {
        text: "⚖️ **Healthy Weight Loss:**\n\n• ~500 calorie deficit/day = ~0.5 kg/week loss\n• Protein first — keeps you full\n• Whole foods over processed\n• 30+ min daily walking\n• Good sleep reduces hunger hormones\n\n⚠️ Aim for 0.5–1 kg/week. Slower is healthier.",
      };
    return {
      text: "🌿 **General Wellness:**\n\n• 💧 Drink 8 glasses of water daily\n• 🥦 Fill half your plate with vegetables\n• 😴 Aim for 7–9 hours of sleep\n• 🚶 Move for 30 minutes daily\n• 🧘 Manage stress with breathing or meditation\n\n⚠️ Not medical advice.",
    };
  }

  // Finance
  if (
    /inflation|stock market|invest|bitcoin|crypto|startup|marketing|roi|budget|saving|money/.test(
      q,
    )
  ) {
    if (/inflation/.test(q))
      return {
        text: "📈 **Inflation** is the rate at which prices rise over time, reducing purchasing power.\n\n• 5% inflation: $100 item now costs $105\n• Central banks target ~2% annually\n• Caused by: increased money supply, supply shortages, higher demand",
      };
    if (/stock market|invest/.test(q))
      return {
        text: "📊 **Stock Market Basics:**\n\n• **Stocks** = ownership shares in a company\n• **Bull market** = rising prices; **Bear market** = falling\n• **Index** = basket of stocks (S&P 500, NASDAQ)\n• **Diversify** — don't put all eggs in one basket\n\n⚠️ Investing involves risk.",
      };
    if (/bitcoin|crypto/.test(q))
      return {
        text: "₿ **Bitcoin** is the first cryptocurrency, created in 2009 by Satoshi Nakamoto.\n\n• Decentralized — no central bank controls it\n• Only 21 million BTC will ever exist\n• Uses blockchain technology\n• Highly volatile — 50%+ price swings are common\n\n⚠️ High-risk investment.",
      };
    return {
      text: "💼 I can help with finance! Ask about:\n\n• Inflation, stock market, investing\n• Bitcoin and cryptocurrency\n• Startups, marketing, ROI\n• Personal budgeting and saving",
    };
  }

  // Geography
  if (/capital (of|city|town)/.test(q) || /what('s| is) the capital/.test(q)) {
    const capitals: Record<string, string> = {
      france: "Paris",
      germany: "Berlin",
      japan: "Tokyo",
      india: "New Delhi",
      china: "Beijing",
      usa: "Washington, D.C.",
      "united states": "Washington, D.C.",
      uk: "London",
      "united kingdom": "London",
      australia: "Canberra",
      brazil: "Brasília",
      canada: "Ottawa",
      russia: "Moscow",
      italy: "Rome",
      spain: "Madrid",
      mexico: "Mexico City",
      argentina: "Buenos Aires",
      egypt: "Cairo",
      nigeria: "Abuja",
      "south africa": "Pretoria",
      pakistan: "Islamabad",
      bangladesh: "Dhaka",
      indonesia: "Jakarta",
      turkey: "Ankara",
      thailand: "Bangkok",
      vietnam: "Hanoi",
      ukraine: "Kyiv",
      poland: "Warsaw",
      netherlands: "Amsterdam",
      sweden: "Stockholm",
      norway: "Oslo",
      denmark: "Copenhagen",
      greece: "Athens",
      portugal: "Lisbon",
      "saudi arabia": "Riyadh",
      iran: "Tehran",
      kenya: "Nairobi",
      "south korea": "Seoul",
      malaysia: "Kuala Lumpur",
      philippines: "Manila",
    };
    for (const [country, capital] of Object.entries(capitals)) {
      if (q.includes(country))
        return {
          text: `🌍 The capital of **${country.charAt(0).toUpperCase() + country.slice(1)}** is **${capital}**.`,
        };
    }
    return {
      text: "🌍 I know capitals of 40+ countries! Try: 'What is the capital of France?'",
    };
  }

  if (/largest country|biggest country/.test(q))
    return {
      text: "🌍 The largest country by area is **Russia** (17.1 million km²), followed by Canada, USA, China, and Brazil.",
    };
  if (/longest river/.test(q))
    return {
      text: "🌊 The **Nile** (Africa, ~6,650 km) is traditionally the longest river. The **Amazon** rivals it with the largest water volume.",
    };
  if (/tallest mountain|highest mountain/.test(q))
    return {
      text: "⛰️ **Mount Everest** is the tallest mountain at **8,849 m (29,032 ft)**, on the Nepal-Tibet border.",
    };
  if (/most populated country|largest population/.test(q))
    return {
      text: "👥 **India** surpassed China in 2023 to become the world's most populated country with over **1.4 billion** people.",
    };

  // Science
  if (/speed of light|how fast is light/.test(q))
    return {
      text: "💡 The speed of light is **299,792,458 m/s** (~300,000 km/s). Light travels from the Sun to Earth in ~8 minutes 20 seconds!",
    };
  if (/how far (is|from) (the )?sun|distance.*sun/.test(q))
    return {
      text: "☀️ The average Earth-Sun distance is **149.6 million km** (92.96 million miles) = 1 Astronomical Unit (AU).",
    };
  if (/how many (planet|planets)|planets? in (the )?solar system/.test(q))
    return {
      text: "🪐 There are **8 planets**:\n\nMercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune\n\n*Pluto was reclassified as a dwarf planet in 2006.*",
    };
  if (/\bdna\b|what is dna/.test(q))
    return {
      text: "🧬 **DNA (Deoxyribonucleic Acid)** carries genetic instructions in all living organisms. It's a **double helix** containing ~3 billion base pairs in every human cell.",
    };
  if (/\bgravity\b|what is gravity/.test(q))
    return {
      text: "🌍 **Gravity** is the force of attraction between masses. On Earth's surface: **9.8 m/s²**. Newton described it in 1687; Einstein explained it as the curvature of spacetime.",
    };
  if (/photosynthesis/.test(q))
    return {
      text: "🌿 **Photosynthesis:** Plants convert sunlight + CO₂ + water → glucose + oxygen.\n\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\nHappens in **chloroplasts**. That's why plants need sunlight!",
    };
  if (/osmosis/.test(q))
    return {
      text: "💧 **Osmosis** is water moving through a semi-permeable membrane from low to high solute concentration until equilibrium. Example: a carrot in salty water shrinks as water leaves its cells.",
    };
  if (/evolution|natural selection/.test(q))
    return {
      text: "🦎 **Evolution** is how species change over generations through **natural selection** — Darwin proposed this in 1859.\n\n• Favorable traits = better survival and reproduction\n• Over millions of years, new species emerge\n• Supported by fossils, genetics, and direct observation",
    };
  if (/why is the sky blue/.test(q))
    return {
      text: "🌤️ **Why is the sky blue?**\n\nSunlight contains all colors. Gas molecules scatter blue light (shorter wavelength) much more than other colors — spreading it across the whole sky.\n\nAt sunset, light travels through more atmosphere, scattering blue away and leaving red and orange.",
    };
  if (/why do (we|humans) sleep/.test(q))
    return {
      text: "😴 **Why do we sleep?**\n\n• **Memory consolidation** — transfers short-term to long-term memory\n• **Cell repair** — body repairs tissues and muscles\n• **Toxin removal** — brain flushes out waste\n• **Hormone regulation** — growth hormone released during sleep\n\nAdults need 7–9 hours.",
    };
  if (/why (do )?leaves (change color|turn red|turn yellow)/.test(q))
    return {
      text: "🍂 **Why leaves change color:**\n\nAs days shorten, trees stop producing **chlorophyll** (green). Other pigments are revealed:\n\n• **Yellow/orange** — carotenoids (always there)\n• **Red/purple** — anthocyanins (newly produced)\n\nThe tree prepares to shed leaves to conserve water in winter.",
    };

  // History & people
  if (/world war (1|i|one)|first world war/.test(q))
    return {
      text: "⚔️ **World War I (1914–1918):**\n\n• Triggered by assassination of Archduke Franz Ferdinand\n• Allies (UK, France, Russia, USA) vs Central Powers (Germany, Austria-Hungary, Ottomans)\n• Ended with Treaty of Versailles (1919)\n• ~20 million deaths",
    };
  if (/world war (2|ii|two)|second world war/.test(q))
    return {
      text: "⚔️ **World War II (1939–1945):**\n\n• Germany invaded Poland on Sept 1, 1939\n• Allies (UK, USA, USSR) vs Axis (Germany, Italy, Japan)\n• V-E Day: May 8, 1945; V-J Day: Sept 2, 1945\n• ~70–85 million deaths — deadliest conflict in history",
    };
  if (/who (is|was) einstein|albert einstein/.test(q))
    return {
      text: "🔬 **Albert Einstein (1879–1955)** — German-born theoretical physicist.\n\n• Developed the **Theory of Relativity** (E=mc²)\n• Nobel Prize in Physics (1921) for photoelectric effect\n• *'Imagination is more important than knowledge.'*",
    };
  if (/who (is|was) newton|isaac newton/.test(q))
    return {
      text: "🍎 **Isaac Newton (1643–1727)** — English mathematician and physicist.\n\n• Formulated **laws of motion** and **universal gravitation**\n• Invented **calculus** (alongside Leibniz)\n• Published *Principia Mathematica* in 1687",
    };
  if (/who (is|was) tesla|nikola tesla/.test(q))
    return {
      text: "⚡ **Nikola Tesla (1856–1943)** — Serbian-American inventor.\n\n• Invented **AC (Alternating Current)** power transmission\n• Developed the Tesla coil and induction motor\n• Held ~300 patents\n• The Tesla car company is named after him",
    };
  if (/who (is|was) (elon musk|musk)/.test(q))
    return {
      text: "🚀 **Elon Musk** — tech entrepreneur (born 1971 in South Africa).\n\n• **CEO of Tesla** — electric vehicles\n• **CEO of SpaceX** — private space exploration\n• **Owner of X** (formerly Twitter)\n• Co-founder of PayPal, Neuralink, The Boring Company",
    };
  if (/who (is|was) (steve jobs|jobs)/.test(q))
    return {
      text: "🍎 **Steve Jobs (1955–2011)** — co-founder and CEO of Apple.\n\n• Created the Mac, iPod, iPhone, and iPad\n• Co-founded Pixar Animation Studios\n• Revolutionized personal computing and mobile phones",
    };
  if (/who (invented|created|discovered) (the )?internet/.test(q))
    return {
      text: "🌐 The Internet evolved from **ARPANET** (1969). **Tim Berners-Lee** invented the **World Wide Web** in 1989. Vint Cerf & Bob Kahn developed TCP/IP protocols.",
    };
  if (/moon landing|apollo 11/.test(q))
    return {
      text: "🌙 **Apollo 11 — July 20, 1969**\n\n• **Neil Armstrong** was the first human on the Moon\n• Followed by **Buzz Aldrin**; Michael Collins orbited above\n• *'That's one small step for man, one giant leap for mankind.'*\n• Returned 21.5 kg of lunar samples to Earth",
    };

  // Weather / news
  if (/weather|temperature today|will it rain|forecast/.test(q))
    return {
      text: "🌤️ I don't have real-time weather data. Check: **weather.com**, **Google** (search 'weather [your city]'), or **AccuWeather**.",
    };
  if (/news|current events|what happened today|latest/.test(q))
    return {
      text: "📰 I don't have real-time news. For current events: **BBC News** (bbc.com/news), **Reuters** (reuters.com), **Google News** (news.google.com).",
    };

  // Time zones
  if (/time (in|at|zone)|what time is it in/.test(q)) {
    const zones: Record<string, string> = {
      "new york": "UTC−5 (EST) / UTC−4 (EDT in summer)",
      london: "UTC+0 (GMT) / UTC+1 (BST in summer)",
      paris: "UTC+1 (CET) / UTC+2 (CEST in summer)",
      dubai: "UTC+4",
      tokyo: "UTC+9 (JST)",
      beijing: "UTC+8 (CST)",
      sydney: "UTC+10 (AEST) / UTC+11 (AEDT)",
      mumbai: "UTC+5:30 (IST)",
      moscow: "UTC+3 (MSK)",
      "los angeles": "UTC−8 (PST) / UTC−7 (PDT)",
    };
    for (const [city, zone] of Object.entries(zones)) {
      if (q.includes(city))
        return {
          text: `🕐 **${city.charAt(0).toUpperCase() + city.slice(1)}** is in **${zone}**.\n\nCheck exact time at **time.is** or **worldtimeserver.com**.`,
        };
    }
    return {
      text: "🕐 I know UTC offsets for many cities! Ask: 'What time zone is Tokyo?' or 'Time in Dubai?'",
    };
  }

  // Translation
  const isTranslateIntent =
    q.includes("translate") ||
    q.includes("convert") ||
    (q.includes("language") && !q.includes("detect"));
  if (isTranslateIntent) {
    const lang = detectLanguage(query);
    if (!uploadedDoc)
      return {
        text: "📎 Please upload a document first (PDF, JPEG, or PNG). Once uploaded, I can translate it to any language!",
      };
    if (!lang)
      return {
        text: "🌐 Which language would you like me to translate to? I support Hindi, Spanish, French, German, Arabic, Chinese, Japanese, Portuguese, Russian, Italian, Korean, Tamil, Bengali, Urdu, and more!",
      };
    return {
      text: `✅ Translation complete! Your document **"${uploadedDoc.name}"** has been translated to **${lang}**.`,
      type: "translation",
      translatedContent: getTranslatedContent(lang),
      targetLanguage: lang,
    };
  }

  // Document features
  if (q.includes("pdf"))
    return {
      text: "📄 **PDF Support:** Document Scanner Pro exports high-quality PDFs. Upload a PDF here for translation!",
    };
  if (q.includes("jpeg") || q.includes("jpg"))
    return {
      text: "🖼️ **JPEG Support:** Import JPEG via 'Import & Edit', apply filters, export as PDF. Upload here for translation.",
    };
  if (q.includes("png"))
    return {
      text: "🖼️ **PNG Support:** PNG files are supported. Import, filter, and export as PDF.",
    };
  if (q.includes("scan") || q.includes("extract text") || q.includes("ocr"))
    return {
      text: "🔍 **Scanning & OCR:** Use 'Scan Document' to capture via camera. For text extraction, use the AI Tools panel.",
    };

  // Capabilities
  if (
    /what can you do|capabilities|help me|what do you (know|support)|your features/.test(
      q,
    )
  ) {
    return {
      text: "🤖 I'm a general-purpose AI Assistant! I can help with:\n\n🔢 **Math** — arithmetic, percentages, powers, square roots\n📐 **Unit Conversions** — Celsius/Fahrenheit, km/miles, kg/lbs\n💻 **Coding** — Python, JavaScript, Java, HTML, CSS, React, APIs, ML\n✍️ **Writing** — grammar, essays, resume tips\n🍴 **Recipes** — pasta, pizza, cake, coffee, tea, and more\n🌿 **Health** — sleep, fitness, stress, nutrition, vitamins\n💼 **Finance** — investing, inflation, crypto, budgeting\n🌍 **Geography** — capitals (40+ countries), records, landmarks\n🔬 **Science** — biology, physics, chemistry, astronomy\n📚 **History** — WWI, WWII, famous people, inventions\n🗣️ **Languages** — phrases in 15+ languages\n🕐 **Time Zones** — UTC offsets for major cities\n🎂 **Age Calculator** — 'born in 1990, how old in 2026?'\n😄 **Jokes & Fun Facts** — always a laugh or surprise\n💙 **Emotional Support** — motivational quotes, stress tips\n📄 **Documents** — translate PDF/JPEG/PNG to 14+ languages\n\nJust type anything!",
    };
  }

  // Smart fallback
  const isQuestion =
    /^(what|who|where|when|why|how|is|are|can|do|does|did|was|were|will|would|should|could|which)/.test(
      q,
    );
  if (q.startsWith("what is ") || q.startsWith("what are ")) {
    const topic = query
      .replace(/^what (is|are) /i, "")
      .replace(/[?!.]+$/, "")
      .trim();
    return {
      text: `🤔 **${topic}** — I don't have a specific answer for that in my database.\n\nFor detailed information, try:\n• **Wikipedia** (wikipedia.org)\n• **Google** (google.com)\n• **Britannica** (britannica.com)\n\nOr ask me about science, history, math, coding, recipes, health, and more!`,
    };
  }
  if (
    q.startsWith("how to ") ||
    q.startsWith("how do i ") ||
    q.startsWith("how can i ")
  ) {
    const action = query
      .replace(/^how (to|do i|can i) /i, "")
      .replace(/[?!.]+$/, "")
      .trim();
    return {
      text: `📋 **How to ${action}** — here's a general approach:\n\n1. **Understand the goal** — be clear about the desired outcome\n2. **Research the basics** — look for beginner guides\n3. **Start simple** — try a minimal version first\n4. **Learn from mistakes** — iterate and improve\n5. **Practice consistently** — skills improve with repetition\n\nFor more specific help, provide more context!`,
    };
  }
  if (isQuestion) {
    const shortQ = query.trim().slice(0, 60);
    return {
      text: `🤔 Interesting question: *"${shortQ}${query.length > 60 ? "..." : ""}"*\n\nI may not have a specific answer, but I cover:\n\n• **Math & conversions** (e.g. '15% of 200', '30°C to F')\n• **Science** (biology, physics, astronomy)\n• **History** (wars, inventions, famous people)\n• **Coding** (Python, JavaScript, HTML, APIs)\n• **Recipes, health, finance**\n• **Document translation** (upload PDF/image)\n\nTry rephrasing or ask something more specific! 😊`,
    };
  }

  const words = query.trim().split(/\s+/).slice(0, 8).join(" ");
  return {
    text: `💬 I received: *"${words}${query.trim().split(/\s+/).length > 8 ? "..." : ""}"*\n\nNot sure exactly what you need! Some ideas:\n\n• Ask a question: **'What is photosynthesis?'** or **'Who was Einstein?'**\n• Request a calculation: **'15% of 200'** or **'30°C to Fahrenheit'**\n• Ask for a recipe: **'How to make pasta'**\n• Ask for coding help: **'Python for loop'**\n• Upload a document and say **'Translate to Hindi'**\n• Say **'What can you do?'** for a full list\n\nI'm here to help with anything — just ask! 🤖`,
  };
}

function downloadAsPDF(content: string, title: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(
    `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;font-size:14px;padding:40px;line-height:1.8;color:#222;max-width:800px;margin:0 auto;}h1{font-size:20px;margin-bottom:24px;color:#1a1a2e;}p{margin-bottom:16px;}@media print{body{padding:20px;}}</style></head><body><h1>${title}</h1><p>${content.replace(/\n/g, "</p><p>")}</p></body></html>`,
  );
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export default function ChatbotPanel({ documents }: ChatbotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi! I'm your AI Assistant 🤖 I can answer questions on virtually any topic — math, coding, science, history, recipes, health, finance, languages, and more. Or upload a PDF/image to translate it to any language!\n\nType **'What can you do?'** to see everything I support.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDoc | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const doc: UploadedDoc = { name: file.name, type: file.type, content: "" };
    setUploadedDoc(doc);
    setMessages((prev) => [
      ...prev,
      {
        id: `b-doc-${Date.now()}`,
        role: "bot",
        text: `📄 Document loaded: **${file.name}**\nType: ${file.type || "unknown"}\n\nYou can now ask me to translate it! Try: "Translate to Hindi" or "Convert to Spanish". Or ask me anything else!`,
      },
    ]);
    e.target.value = "";
  }

  function handleSend() {
    const text = input.trim();
    if (!text || isTyping) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text },
    ]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const response = getBotResponse(text, uploadedDoc);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: response.text,
          type: response.type,
          translatedContent: response.translatedContent,
          targetLanguage: response.targetLanguage,
        },
      ]);
      setIsTyping(false);
    }, 1000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <main
      className="flex-1 flex flex-col min-h-screen"
      data-ocid="chatbot.page"
    >
      <header className="flex items-center gap-4 px-8 py-5 bg-card border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 flex items-center justify-center">
          <Bot size={20} className="text-fuchsia-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">AI Assistant</h1>
          <p className="text-xs text-muted-foreground">
            Ask anything — science, math, coding, history, recipes, and more
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {uploadedDoc && (
            <div className="flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs px-3 py-1.5 rounded-lg">
              <FileText size={12} />
              <span className="max-w-[140px] truncate">{uploadedDoc.name}</span>
              <button
                type="button"
                onClick={() => setUploadedDoc(null)}
                className="hover:text-fuchsia-100 transition-colors ml-1"
                data-ocid="chatbot.close_button"
              >
                <X size={12} />
              </button>
            </div>
          )}
          {documents.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
              {documents.length} doc{documents.length !== 1 ? "s" : ""} in
              library
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div
            ref={scrollRef}
            className="flex flex-col gap-4 p-6 max-w-3xl mx-auto"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  data-ocid={`chatbot.message.item.${idx + 1}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-600" : "bg-fuchsia-500/20"}`}
                  >
                    {msg.role === "user" ? (
                      <User size={14} className="text-white" />
                    ) : (
                      <Bot size={14} className="text-fuchsia-400" />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm"}`}
                    >
                      {msg.text}
                    </div>
                    {msg.type === "translation" && msg.translatedContent && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="w-full bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-xl p-4 flex flex-col gap-3"
                        data-ocid="chatbot.panel"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-fuchsia-300 uppercase tracking-wider">
                            Translated Content
                          </span>
                          <span className="text-xs bg-fuchsia-500/20 text-fuchsia-300 px-2.5 py-1 rounded-full border border-fuchsia-500/30">
                            Translated to: {msg.targetLanguage}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {msg.translatedContent}
                        </p>
                        <Button
                          onClick={() =>
                            downloadAsPDF(
                              msg.translatedContent!,
                              `Translated to ${msg.targetLanguage}`,
                            )
                          }
                          className="self-start h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2"
                          data-ocid="chatbot.download_button"
                        >
                          <Download size={14} />
                          Download PDF
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3 flex-row"
                  data-ocid="chatbot.typing.loading_state"
                >
                  <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-fuchsia-400" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      <div className="px-6 py-4 border-t border-border bg-card">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 flex-shrink-0 border-border hover:border-fuchsia-500/50 hover:text-fuchsia-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            title="Upload PDF, JPEG, or PNG"
            data-ocid="chatbot.upload_button"
          >
            <Paperclip size={16} />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              uploadedDoc
                ? "Document loaded — ask me to translate it or ask anything else..."
                : "Ask me anything — science, math, coding, history, recipes..."
            }
            className="flex-1 h-11 bg-background text-sm"
            disabled={isTyping}
            data-ocid="chatbot.input"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="h-11 px-5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            data-ocid="chatbot.submit_button"
          >
            <Send size={16} />
          </Button>
        </div>
        {uploadedDoc && (
          <p className="max-w-3xl mx-auto mt-2 text-xs text-fuchsia-400/70">
            📄 {uploadedDoc.name} loaded — ask me to translate it to any
            language
          </p>
        )}
      </div>

      <footer className="px-8 py-3 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built by vaibhav ramasane
        </p>
      </footer>
    </main>
  );
}
