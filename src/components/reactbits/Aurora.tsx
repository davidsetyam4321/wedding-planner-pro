/**
 * Aurora — latar blob warna bergerak sangat perlahan (gaya React Bits),
 * memakai tint palet (petal / leaf / bloom) sehingga mengikuti tema.
 * Dipasang sebagai latar dekoratif: `position: fixed/absolute` + `-z-10`.
 */
export default function Aurora({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`aurora ${className}`}>
      <span className="aurora__blob aurora__blob--1" />
      <span className="aurora__blob aurora__blob--2" />
      <span className="aurora__blob aurora__blob--3" />
    </div>
  );
}
