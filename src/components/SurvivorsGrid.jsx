// Yarışma boyunca kalan katılımcıları küçük daireler halinde gösterir.
// Katılımcı sayısı azaldıkça (bir sonraki soruya geçince), fazla
// dairelerin sönmesi CSS geçişiyle otomatik animasyonlanır.
// Çok kalabalık yarışmalarda (50'den fazla) daireler orantılı gösterilir.
const MAX_DOTS = 40;

export default function SurvivorsGrid({ total, alive }) {
  if (!total || total <= 1) return null;

  const dotCount = Math.min(MAX_DOTS, total);
  const aliveDots = Math.round((alive / total) * dotCount);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        justifyContent: 'center',
        maxWidth: '220px',
        margin: '0.75rem auto',
        position: 'relative',
        zIndex: 1,
      }}
      title={`${alive} / ${total} yarışmacı hayatta`}
    >
      {Array.from({ length: dotCount }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: i < aliveDots ? '#2f8f7c' : 'rgba(122, 95, 112, 0.25)',
            transition: 'background 0.6s ease, transform 0.6s ease',
            transform: i < aliveDots ? 'scale(1)' : 'scale(0.7)',
          }}
        />
      ))}
    </div>
  );
}
