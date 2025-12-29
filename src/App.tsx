import './App.css'
import {
  HsafaChat,
  HsafaProvider,
  type CustomToolUIRenderProps,
} from '@hsafa/ui-sdk';

function ShowSourceUI({ output }: CustomToolUIRenderProps) {
  const result = output?.result;

  if (!result) return null;

  const fileId = result.file_id || result.fileId;
  const page = result.page ? Number(result.page) : 1;

  return (
    <div
      style={{
        width: '100%',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: 12,
        background: 'rgba(0,0,0,0.25)',
      }}
    >
      {result.error ? (
        <div style={{ color: '#f87171', fontSize: 13 }}>{result.error}</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <iframe
              src={`/ksu_files/${fileId}.pdf#page=${page}`}
              style={{
                width: '100%',
                height: '600px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.03)',
              }}
              title={`PDF صفحة ${page}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const agentId = import.meta.env.VITE_AGENT_ID;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  return (
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
        ]}
      />
    </HsafaProvider>
  )
}

export default App
