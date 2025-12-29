import './App.css'
import {
  HsafaChat,
  HsafaProvider,
  type CustomToolUIRenderProps,
} from '@hsafa/ui-sdk';
import { useState, useEffect, type ReactNode } from 'react';
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Icon } from '@iconify/react';

// Use local worker to avoid CORS issues
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

type ToolUIProps = CustomToolUIRenderProps & { toolName: string };

function asRecord(val: unknown): Record<string, unknown> | undefined {
  return val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : undefined;
}

function getString(obj: Record<string, unknown> | undefined, key: string): string | undefined {
  const val = obj?.[key];
  return typeof val === 'string' ? val : undefined;
}

function extractImageUrl(data: unknown): string | undefined {
  const rec = asRecord(data);
  if (!rec) return undefined;
  const url = getString(rec, 'image_url') || getString(rec, 'imageUrl') || getString(rec, 'url');
  if (url) return url;
  const result = asRecord(rec.result);
  return result ? getString(result, 'image_url') || getString(result, 'imageUrl') || getString(result, 'url') : undefined;
}

function getStatusBadge(status?: string, hasOutput?: boolean) {
  if (status === 'running' || status === 'pending') {
    return {
      label: 'Running',
      bg: 'rgba(99,102,241,0.14)',
      border: 'rgba(99,102,241,0.35)',
      color: '#A78BFA',
      running: true,
    };
  }
  if (hasOutput) {
    return {
      label: 'Done',
      bg: 'rgba(34,197,94,0.14)',
      border: 'rgba(34,197,94,0.35)',
      color: '#86EFAC',
      running: false,
    };
  }
  return {
    label: 'Pending',
    bg: 'rgba(148,163,184,0.14)',
    border: 'rgba(148,163,184,0.35)',
    color: '#CBD5E1',
    running: false,
  };
}

function ToolCard(props: ToolUIProps & { title: string; icon: string; summary?: string; children?: ReactNode; badgeOverride?: ReturnType<typeof getStatusBadge> }) {
  const badge = props.badgeOverride || getStatusBadge(props.status, props.output !== undefined);
  return (
    <div style={{
      borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(135deg, rgba(26,27,30,0.9) 0%, rgba(23,24,28,0.95) 100%)',
      padding: '14px 14px',
      marginTop: '10px',
      boxShadow: badge.running
        ? '0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(99,102,241,0.28)'
        : '0 12px 40px rgba(0,0,0,0.25)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))',
            border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon icon={props.icon} style={{ fontSize: '18px', color: '#A78BFA' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 0
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {props.title}
              </div>
              <code style={{
                fontSize: '11px',
                color: '#AAA',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.04)'
              }}>
                {props.toolName}
              </code>
            </div>
            {props.summary ? (
              <div style={{
                fontSize: '12px',
                color: '#9CA3AF',
                marginTop: '4px',
                lineHeight: 1.4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {props.summary}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '999px',
          backgroundColor: badge.bg,
          border: `1px solid ${badge.border}`,
          color: badge.color,
          textTransform: 'capitalize',
          flexShrink: 0
        }}>
          {badge.label}
        </div>
      </div>

      {props.children}
    </div>
  );
}

function ImageGeneratorToolUI(props: ToolUIProps) {
  const input = asRecord(props.input);
  const prompt = getString(input, 'prompt') || getString(input, 'description') || getString(input, 'text');
  const imageUrl = extractImageUrl(props.output) || extractImageUrl(props.input);
  const [isExpanded, setIsExpanded] = useState(false);

  const isLoading = !imageUrl;
  const badgeOverride = isLoading
    ? {
        label: 'Generating…',
        bg: 'rgba(99,102,241,0.14)',
        border: 'rgba(99,102,241,0.35)',
        color: '#A78BFA',
        running: true,
      }
    : undefined;

  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <>
      <ToolCard
        {...props}
        title={isLoading ? 'Generating image…' : 'Image ready'}
        icon={isLoading ? 'lucide:loader-2' : 'lucide:image'}
        summary={prompt ? `Prompt: ${prompt}` : 'Creating a slide visual'}
        badgeOverride={badgeOverride}
      >
        <style>
          {'@keyframes hsafaSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}
        </style>
        {isLoading ? (
          <div style={{
            marginTop: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(0,0,0,0.18)',
            padding: '14px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#CBD5E1'
          }}>
            <Icon icon="lucide:loader-2" style={{ fontSize: '18px', color: '#A78BFA', animation: 'hsafaSpin 1s linear infinite' }} />
            <div style={{ fontSize: '12px', fontWeight: 700 }}>Generating the image for your infographic…</div>
          </div>
        ) : null}

        {imageUrl ? (
          <div 
            style={{
              marginTop: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(0,0,0,0.18)',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onClick={() => setIsExpanded(true)}
          >
            <img
              src={imageUrl}
              alt="Generated"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        ) : null}
      </ToolCard>

      {isExpanded && imageUrl && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.95)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsExpanded(false);
          }}
        >
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: "white",
              fontSize: 24,
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>

          <div style={{ maxWidth: "95vw", maxHeight: "95vh", overflow: "auto" }}>
            <img
              src={imageUrl}
              alt="Generated (expanded)"
              style={{ 
                maxWidth: "100%", 
                maxHeight: "95vh", 
                display: "block",
                objectFit: "contain"
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function ShowSourceUI({ output }: CustomToolUIRenderProps) {
  const getPageWidth = () => {
    const screenWidth = window.innerWidth;
    return screenWidth < 765 ? screenWidth - 48 : 712;
  };

  const [pageWidth, setPageWidth] = useState(getPageWidth);
  const [expandedPageIndex, setExpandedPageIndex] = useState<number | null>(null);

  const result = output?.result;
  const fileId = result?.file_id || result?.fileId;
  const startPage = result?.start_page || result?.startPage || 1;
  const endPage = result?.end_page || result?.endPage || startPage;

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  useEffect(() => {
    const handleResize = () => setPageWidth(getPageWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (expandedPageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedPageIndex(null);
      } else if (e.key === 'ArrowLeft' && expandedPageIndex > 0) {
        setExpandedPageIndex(expandedPageIndex - 1);
      } else if (e.key === 'ArrowRight' && expandedPageIndex < pages.length - 1) {
        setExpandedPageIndex(expandedPageIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedPageIndex, pages.length]);

  if (!result) return null;

  const url = `/ksu_files/${fileId}.pdf`;

  const getGridColumns = (pageCount: number) => {
    if (pageCount <= 1) return 1;
    if (pageCount <= 4) return 2;
    return pageCount <= 9 ? 3 : 4;
  };

  const gridColumns = getGridColumns(pages.length);
  const itemWidth = pageWidth / gridColumns - (gridColumns > 1 ? 12 : 0);

  const handlePrevPage = () => {
    if (expandedPageIndex !== null && expandedPageIndex > 0) {
      setExpandedPageIndex(expandedPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (expandedPageIndex !== null && expandedPageIndex < pages.length - 1) {
      setExpandedPageIndex(expandedPageIndex + 1);
    }
  };

  return (
    <>
      <div style={{ width: "100%", }}>
        {result.error ? (
          <div style={{ color: "#f87171", fontSize: 13 }}>{result.error}</div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
            gap: 12
          }}>
            {pages.map((pageNum, index) => (
              <div 
                key={pageNum}
                onClick={() => setExpandedPageIndex(index)}
                style={{ cursor: "pointer" }}
              >
                <Document file={url}>
                  <Page pageNumber={pageNum} renderTextLayer={false} width={itemWidth} />
                </Document>
              </div>
            ))}
          </div>
        )}
      </div>

      {expandedPageIndex !== null && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.95)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpandedPageIndex(null);
          }}
        >
          <button
            onClick={() => setExpandedPageIndex(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: "white",
              fontSize: 24,
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>

          {expandedPageIndex > 0 && (
            <button
              onClick={handlePrevPage}
              style={{
                position: "absolute",
                left: 20,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                color: "white",
                fontSize: 24,
                width: 50,
                height: 50,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
          )}

          <div style={{ maxWidth: "90vw", maxHeight: "90vh", overflow: "auto" }}>
            <Document file={url}>
              <Page 
                pageNumber={pages[expandedPageIndex]} 
                renderTextLayer={false}
                width={Math.min(1200, window.innerWidth * 0.9)}
              />
            </Document>
          </div>

          {expandedPageIndex < pages.length - 1 && (
            <button
              onClick={handleNextPage}
              style={{
                position: "absolute",
                right: 20,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                color: "white",
                fontSize: 24,
                width: 50,
                height: 50,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              →
            </button>
          )}
        </div>
      )}
    </>
  );
}

function App() {
  const agentId = import.meta.env.VITE_AGENT_ID;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  return (
    <div>
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          left: 10,
          zIndex: 10000,
          width: 'clamp(40px, 6vw, 64px)',
          height: 'clamp(40px, 6vw, 64px)',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/ksu-logo.png"
          alt="KSU"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.55))',
          }}
        />
      </div>

      <HsafaProvider baseUrl={baseUrl} theme={"dark"} dir="rtl">
        <HsafaChat
          agentId={agentId}
          theme={"dark"}
          dir="rtl"
          language="ar"
          fullPageChat
          title="حصيف جامعة الملك سعود"
          placeholder="اكتب سؤالك هنا..."
          emptyStateMessage="كيف يمكنني مساعدتك اليوم؟"
          HsafaUI={{
            show_source: ShowSourceUI,
            imageGenerator: ImageGeneratorToolUI,
          }}
          presetPrompts={[
            {
              label: "🎓 دليل السنة الأولى (مختصر)",
              prompt:
                "لخّص لي أهم ما يجب أن أعرفه كطالب/طالبة في السنة الأولى المشتركة بجامعة الملك سعود: النظام الأكاديمي، الغياب والحرمان، التخصيص، والروابط المهمة. أعطني نقاط مختصرة.",
            },
            {
              label: "📝 الغياب والحرمان",
              prompt:
                "اشرح لي ضوابط الغياب والحرمان في السنة الأولى المشتركة: متى يتم الحرمان؟ وما الذي يجب أن أفعله إذا اقتربت من نسبة الغياب؟ قدّم الإجابة كنقاط واضحة.",
            },
            {
              label: "🌐 بوابة Edugate",
              prompt:
                "أعطني شرحاً سريعاً لكيفية الدخول إلى بوابة النظام الأكاديمي (Edugate) وما أهم الخدمات التي أستخدمها فيها كطالب سنة أولى.",
            },
            {
              label: "🧾 بوابة خدماتي (EFY Gate)",
              prompt:
                "ما هي بوابة خدماتي الإلكترونية (efy gate)؟ وما الخدمات التي توفرها مثل الحضور، الحرمان، جداول الاختبارات، الدرجات، والاستبانات؟",
            },
            {
              label: "📄 اعرض المصدر (إذا طلبت ذلك)",
              prompt:
                "أريد رؤية المصدر: اعرض لي صفحة/صفحات المصدر ذات الصلة فقط (Show Source) التي استندتَ إليها في إجابتك، ولا تعرض صفحات غير ضرورية. لا تذكر أي معلومات داخلية غير مفيدة مثل رقم الملف.",
            },
            {
              label: "🖼️ أنشئ صورة توضيحية (عند الطلب فقط)",
              prompt:
                "أريد صورة توضيحية: أنشئ صورة/إنفوجرافيك بسيط يوضح البيانات المذكورة في ملفات الـ JSON فقط (مثل جدول/مخطط/تسلسل خطوات)، وابتعد عن أي معلومات غير موجودة في البيانات. لا تعرض روابط/عناوين URL للصورة ولا أي أرقام ملفات داخلية.",
            },
          ]}
        />
      </HsafaProvider>
    </div>
  )
}

export default App
