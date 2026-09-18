// Basit, tekrar kullanılabilir iskelet yükleme bloğu.
export function SkeletonRow() {
  return <div className="skeleton-row" />;
}

export function SkeletonList({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
